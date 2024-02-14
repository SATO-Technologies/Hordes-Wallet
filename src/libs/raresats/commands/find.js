import { sortRangesWithIndices, rangeOverlapsRange, cloneRanges, rangesSize, minRepr } from "../utils/ranges.js"
import { bigIntMin } from "../utils/bigints.js";
import { success, failure } from "../utils/outputMessages.js";
import { SATRIBUTES, typeToListingFunc } from "../rareAndExotic/sats.js";

import fetch from 'node-fetch';
import JSONbig from 'json-bigint';
const JSONbigNative = JSONbig({ useNativeBigInt: true, alwaysParseAsBig: true });


function _getLocations(rareSatsRanges, utxoRanges) {
  let cumulativeOffsets = [0n];
  for (let i = 1; i < utxoRanges.length; i++) {
    cumulativeOffsets.push(cumulativeOffsets[i - 1] + (utxoRanges[i - 1][1] - utxoRanges[i - 1][0] + 1n));
  }

  let sortedIndicesRareSatsRanges = sortRangesWithIndices(rareSatsRanges);
  let sortedIndicesUtxoRanges = sortRangesWithIndices(utxoRanges);

  let locations = [];

  let i = 0;
  let j = 0;
  let rareRange = rareSatsRanges[sortedIndicesRareSatsRanges[i]];
  let utxoRange = utxoRanges[sortedIndicesUtxoRanges[j]];
  while (i < sortedIndicesRareSatsRanges.length && j < sortedIndicesUtxoRanges.length) {
    if (rangeOverlapsRange(rareRange, utxoRange)) {
      let start = rareRange[0]; // equal to bigIntMax(rareRange[0], utxoRange[0])
      let end = bigIntMin(rareRange[1], utxoRange[1]);
      locations.push({
        offset: cumulativeOffsets[sortedIndicesUtxoRanges[j]] + (start - utxoRange[0]),
        size: end - start + 1n,
      });

      if (end == utxoRange[1]) {
        j++;
        rareRange = [end + 1n, rareRange[1]]
        if (j < sortedIndicesUtxoRanges.length) {
          utxoRange = utxoRanges[sortedIndicesUtxoRanges[j]];
        }
      }

      if (end == rareRange[1]) {
        i++;
        if (i < sortedIndicesRareSatsRanges.length) {
          rareRange = rareSatsRanges[sortedIndicesRareSatsRanges[i]];
        }
      }
    }
    else {
      j++;
      if (j < sortedIndicesUtxoRanges.length) {
        utxoRange = utxoRanges[sortedIndicesUtxoRanges[j]];
      }
    }
  }
  return locations;
}

function _mergeLocations(locations) {
  if (locations.length == 0) return [];

  // Step 1: register boundaries
  // Both start and end boundaries are inclusive
  let boundaries = [];
  for (let loc of locations) {
    boundaries.push({ offset: loc.offset, type: 'start', name: loc.type });
    boundaries.push({ offset: loc.offset + loc.size - 1n, type: 'end', name: loc.type });
  }

  // Step 2: sort boundaries by offset
  boundaries.sort((a, b) => {
    if (a.offset < b.offset) return -1;
    if (a.offset > b.offset) return 1;
    return 0;
  });

  // Step 3: group locations
  let mergedLocations = [];
  let active = new Set();
  let last = boundaries[0];
  boundaries.forEach(b => {
    if (active.size > 0n && (last.offset < b.offset || (last.type = 'start' && b.type == 'end' && last.name == b.name))) {
      mergedLocations.push({
        offset: last.offset,
        size: b.offset - last.offset + 1n - (last.type == 'end' ? 1n : 0n) - (b.type == 'start' ? 1n : 0n),
        type: Array.from(active).sort((a, b) => SATRIBUTES.indexOf(a) - SATRIBUTES.indexOf(b)).join('_'),
      });
    }

    if (b.type === 'start') {
      active.add(b.name);
    } else if (b.type === 'end') {
      active.delete(b.name);
    }

    last = b;
  });

  // Step 4: merge adjacent locations of the same type
  let i = 0;
  while (i < mergedLocations.length - 1) {
    if (mergedLocations[i].type == mergedLocations[i + 1].type && mergedLocations[i].offset + mergedLocations[i].size == mergedLocations[i + 1].offset) {
      mergedLocations[i].size += mergedLocations[i + 1].size;
      mergedLocations.splice(i + 1, 1);
    }
    else {
      i++;
    }
  }

  return mergedLocations;
}

function _removeTrailingSlash(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export async function findFromKnownRanges({ outpointToRanges, satributes = null }) {

  let utxos = Object.keys(outpointToRanges);

  if (satributes == null) {
    satributes = SATRIBUTES;
  }
  else {
    // Ensures that types is ordered by priority (SATRIBUTES is)
    satributes = SATRIBUTES.filter(x => satributes.includes(x));
  }

  // This code assumes that the right side of a sat-range is inclusive.
  // The API returns ranges with the right side exclusive, so we subtract 1 from the right side.
  for (let u of utxos) {
    for (let r of outpointToRanges[u]) {
      r[1] = r[1] - 1n;
    }
  }

  let outpointData = {};
  for (let u of utxos) outpointData[u] = {};

  for (let u of utxos) {
    outpointData[u].rareRanges = {};
    for (let s of satributes) {
      // TODO: listingFunc shouldn't change the ranges. For now we clone to avoid an issue.
      let rgs = minRepr(typeToListingFunc[s](cloneRanges(outpointToRanges[u])));
      if (rgs.length > 0) {
        outpointData[u].rareRanges[s] = rgs;
      }
    }
  }

  // Count rare and exotic sats
  let totalCount = {};
  for (let s of satributes) totalCount[s] = 0n;
  for (let u of utxos) outpointData[u].count = {};
  for (let u of utxos) {
    for (let s of satributes) {
      if (outpointData[u].rareRanges[s]) {
        let n = rangesSize(outpointData[u].rareRanges[s]);
        outpointData[u].count[s] = n + (outpointData[u].count[s] || 0n);
        totalCount[s] += n;
      }
    }
  }

  // Add locations
  for (let u of utxos) {
    let locations = [];
    for (let s of satributes) {
      if (outpointData[u].rareRanges[s]) {
        let locs = _getLocations(outpointData[u].rareRanges[s], outpointToRanges[u], s);
        locations = locations.concat(locs.map(x => ({ type: s, ...x })));
      }
    }
    outpointData[u].locations = _mergeLocations(locations);
  }

  // Remove empty outpoints
  for (let u of utxos) {
    if (Object.keys(outpointData[u].rareRanges).length == 0) {
      delete outpointData[u];
    }
  }

  return success({
    totalCount,
    utxos: { ...outpointData },
  });
}
