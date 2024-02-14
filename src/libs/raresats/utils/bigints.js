export function bigIntMin(...args) {
  let min = args[0];
  for (let i = 1; i < args.length; i++) {
    min = min < args[i] ? min : args[i];
  }
  return min;
}

export function bigIntMax(...args) {
  let max = args[0];
  for (let i = 1; i < args.length; i++) {
    max = max > args[i] ? max : args[i];
  }
  return max;
}