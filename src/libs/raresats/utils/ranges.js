import { bigIntMax, bigIntMin } from './bigints.js';

/*
Some of the following function assume that the ranges are in a minimal representation.
It means that the ranges are sorted and that no range overlaps another range.
It also means that for all pair of ranges A, B, we can always find a number x such that A[1] < x < B[0].
Last condition is to ensure that ranges like [[2, 40], [41, 50]] has already been reduced to [[2, 50]].
*/
export function minRepr(ranges) {
  if (ranges.length === 0) {
    return [];
  }
  let sorted_ranges = ranges.sort(function(a, b) {
    if (a[0] < b[0]) {
    return -1;
    }
    if (a[0] > b[0]) {
    return 1;
    }
    return 0;
  });
  let result = [sorted_ranges[0]];
  for (let i = 1; i < sorted_ranges.length; i++) {
    if (result[result.length - 1][1] + 1n >= sorted_ranges[i][0]) {
      result[result.length - 1][1] = bigIntMax(result[result.length - 1][1], sorted_ranges[i][1]);
    }
    else {
      result.push(sorted_ranges[i]);
    }
  }
  return result;
}

export function rangeOverlapsRange(a, b) {
  return (a[0] <= b[1] && b[0] <= a[1]);
}

function rangesOverlapsRangesAssumeMinRepr(a, b) {
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (rangeOverlapsRange(a[i], b[j])) {
      return true;
    }
    if (a[i][1] < b[j][1]) {
      i++;
    } else {
      j++;
    }
  }
  return false;
}

function rangesOverlap(a, b, minimal = false) {
  if (minimal) {
    return rangesOverlapsRangesAssumeMinRepr(a, b);
  }
  return rangesOverlapsRangesAssumeMinRepr(minRepr(a), minRepr(b));
}

function rangeIntersection(a, b) {
  if (rangeOverlapsRange(a, b)) {
    return [bigIntMax(a[0], b[0]), bigIntMin(a[1], b[1])];
  } 
  return [];
}
  
function rangesIntersectionAssumeMinRepr(a, b) {
  let i = 0, j = 0, result = [];
  while (i < a.length && j < b.length) {
    let intersection = rangeIntersection(a[i], b[j]);
    if (intersection.length > 0) {
      result.push(intersection);
    }
    if (a[i][1] < b[j][1]) {
      i++;
    } else {
      j++;
    }
  }
  return result;
}
  
export function rangesIntersection(a, b, minimal = false) {
  if (minimal) {
    return rangesIntersectionAssumeMinRepr(a, b);
  }
  return rangesIntersectionAssumeMinRepr(minRepr(a), minRepr(b));
}

export function rangeSize(range) {
  return range[1] - range[0] + 1n;
}

export function rangesSize(ranges) {
  let result = 0n;
  for (let i = 0; i < ranges.length; i++) {
    result += rangeSize(ranges[i]);
  }
  return result;
}

export function cloneRange(array) {
  return array.slice();
}
  
export function cloneRanges(array) {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(cloneRange(array[i]));
  }
  return result;
}

export function sortRangesWithIndices(ranges) {
  // returns a list of indices that sort the input ranges 
  // in ascending order of their left side.
  return [...ranges.keys()].sort((a, b) => (ranges[a][0] < ranges[b][0]) ? -1 : ((ranges[a][0] > ranges[b][0]) ? 1 : 0));
}