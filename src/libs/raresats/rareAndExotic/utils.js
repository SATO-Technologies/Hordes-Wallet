const COIN = 100000000n;
const HALVING = 210000n;

function blockSubsidy(block_height) {
  return (50n * COIN) >> (BigInt(block_height) / HALVING);
}
  
function firstOrdinalOfBlock(block_height) {
  block_height = BigInt(block_height);
  if (blockSubsidy(block_height) === 0n) {
    // Hey SATO engineers from year 2140, please handle this case.
    throw new Error("No more block rewards");
  }
  let n = block_height / HALVING;
  let res = 0n;
  for (let i = 0n; i < n; i = i + 1n) {
    res += (HALVING * 50n * COIN) >> i;
  }
  res += ((BigInt(block_height) % HALVING) * 50n * COIN) >> n;
  return res;
}

function lastOrdinalOfBlock(block_height) {
  return firstOrdinalOfBlock(block_height) + blockSubsidy(block_height) - 1n;
}

function blockRange(block_height) {
  let first = firstOrdinalOfBlock(block_height);
  let last = first + blockSubsidy(block_height) - 1n;
  return [first, last];
}

function firstOrdinalOfCoin(sat_number) {
  return sat_number - (sat_number % COIN);
}

function lastOrdinalOfCoin(sat_number) {
  return firstOrdinalOfCoin(sat_number) + COIN - 1n;
}

function bitcoinRange(sat_number) {
  let first = firstOrdinalOfCoin(sat_number);
  let last = first + COIN - 1n;
  return [first, last];
}

function creationBlock(sat_number) {
  let reward = 50n * COIN;
  let block = 0n;
  while (HALVING * reward < sat_number) {
    sat_number -= HALVING * reward;
    reward >>= 1n;
    block += HALVING;
  }
  block += sat_number / reward;
  return block;
}

function listFirstOfBlockIntervalInRange(range, interval) {
  let res = [];
  let block = ((creationBlock(range[0]) + interval - 1n) / interval) * interval;
  let first = firstOrdinalOfBlock(block);
  if (first < range[0]) {
    block += interval;
    first = firstOrdinalOfBlock(block);
  }
  while (first <= range[1]) {
    res.push(first);
    block += interval;
    first = firstOrdinalOfBlock(block);
  }
  return res;
}

export function listFirstOfInterval(ranges, interval) {
  let res = [];
  for (let range of ranges) {
    res = [...res, ...listFirstOfBlockIntervalInRange(range, interval)];
  }
  return res;
}

function listLastOfBlockIntervalInRange(range, interval) {
  let res = [];
  let block = ((creationBlock(range[0]) + interval - 1n) / interval) * interval;
  let last = lastOrdinalOfBlock(block);
  if (last < range[0]) {
    block += interval;
    last = lastOrdinalOfBlock(block);
  }
  while (last <= range[1]) {
    res.push(last);
    block += interval;
    last = lastOrdinalOfBlock(block);
  }
  return res;
}

export function listLastOfInterval(ranges, interval) {
  let res = [];
  for (let range of ranges) {
    res = [...res, ...listLastOfBlockIntervalInRange(range, interval)];
  }
  return res;
}

function listFirstOfBitcoinInRange(range) {
  let res = [];
  let first = firstOrdinalOfCoin(range[0]);
  if (first < range[0]) {
    first += COIN;
  }
  while (first <= range[1]) {
    res.push(first);
    first += COIN;
  }
  return res;
}

export function listFirstOfBitcoin(ranges) {
  let res = [];
  for (let range of ranges) {
    res = [...res, ...listFirstOfBitcoinInRange(range)];
  }
  return res;
}

function listLastOfBitcoinInRange(range) {
  let res = [];
  let last = lastOrdinalOfCoin(range[0]);
  if (last < range[0]) {
    last += COIN;
  }
  while (last <= range[1]) {
    res.push(last);
    last += COIN;
  }
  return res;
}

export function listLastOfBitcoin(ranges) {
  let res = [];
  for (let range of ranges) {
    res = [...res, ...listLastOfBitcoinInRange(range)];
  }
  return res;
}

export function satsToRanges(sats) {
  let ranges = [];
  for (let sat of sats) {
    if (typeof sat !== "bigint") {
      throw new Error(`satsToRanges: expected bigint, got ${typeof sat}`);
    }
    ranges.push([sat, sat]);
  }
  return ranges;
}