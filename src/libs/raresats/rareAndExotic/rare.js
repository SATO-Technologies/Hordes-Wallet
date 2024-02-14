import { 
  listFirstOfInterval,
  satsToRanges,
} from "./utils.js";

export function listLegendary(ranges) {
  return satsToRanges(listFirstOfInterval(ranges, 6n * 210000n));
}

export function listEpic(ranges) {
  return satsToRanges(listFirstOfInterval(ranges, 210000n));
}

export function listRare(ranges) {
  return satsToRanges(listFirstOfInterval(ranges, 2016n));
}

export function listUncommon(ranges) {
  return satsToRanges(listFirstOfInterval(ranges, 1n));
}