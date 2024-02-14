import * as constants from "./constants.js";
import { rangesIntersection } from "../utils/ranges.js";
import { 
  satsToRanges,
  listLastOfInterval,
  listFirstOfBitcoin,
  listLastOfBitcoin,
} from "./utils.js";

import { listPalindromes as listPalin} from "./palindromes.js";

export function listFirstTx(ranges) {
  return rangesIntersection(ranges, constants.firstTx);
}

export function listBlock9(ranges) {
  return rangesIntersection(ranges, constants.block9);
}

export function listBlock78(ranges) {
  return rangesIntersection(ranges, constants.block78);
}

export function listVintage(ranges) {
  return rangesIntersection(ranges, constants.vintage);
}

export function listPizza(ranges) {
  return rangesIntersection(ranges, constants.pizza);
}

export function listNakamoto(ranges) {
  return rangesIntersection(ranges, constants.nakamoto);
}

export function listPalindromes(ranges) {
  return satsToRanges(listPalin(ranges));
}

export function listBlack(ranges) {
  return satsToRanges(listLastOfInterval(ranges, 1n));
}

export function listAlpha(ranges) {
  return satsToRanges(listFirstOfBitcoin(ranges));
}

export function listOmega(ranges) {
  return satsToRanges(listLastOfBitcoin(ranges));
}