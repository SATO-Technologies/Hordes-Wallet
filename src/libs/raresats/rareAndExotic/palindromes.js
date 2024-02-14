function numberOfBAdicPalindromesBellowOrEqualTo(n, b) {
  // Yes it's ugly, but it's fast
  // http://ijmcs.future-in-tech.net/14.1/R-Pongsriiam.pdf
  if (n < 0n) {
    return 0n;
  }
  const m = n.toString();
  const k = m.length - 1;
  const kd2_up = BigInt(Math.ceil(k / 2));
  const kd2_down = BigInt(Math.floor(k / 2));
  const Cb_m_star = BigInt(
    m.substring(0, Math.ceil(m.length / 2)) + m.substring(0, Math.floor(m.length / 2)).split('').reverse().join('')
  );
  let res = b ** kd2_up + (n >= Cb_m_star ? 1n : 0n) - 1n;
  for (let i = 0; i <= kd2_down; i++) {
    res += BigInt(m[i]) * (b ** (kd2_down - BigInt(i)));
  }
  return res;
}

function numberOfPalindromesBetween(a, b) {
  if (a > b) {
    return 0;
  }
  return (
    numberOfBAdicPalindromesBellowOrEqualTo(b, 10n) -
    numberOfBAdicPalindromesBellowOrEqualTo(a - 1n, 10n)
  );
}

function increment(s) {
  return (BigInt(s) + 1n).toString();
}

function handleOdd(a) {
  let mid = Math.floor(a.length / 2);
  let left = a.slice(0, mid);
  let right = a.slice(mid + 1);
  if (BigInt(left.split('').reverse().join('')) > BigInt(right)) {
    return left + a[mid] + left.split('').reverse().join('');
  }
  let tmp = increment(left + a[mid]);
  return tmp + tmp.split('').reverse().slice(1).join('');
}

function handleEven(a) {
  let mid = Math.floor(a.length / 2);
  let left = a.slice(0, mid);
  let right = a.slice(mid);
  if (BigInt(left.split('').reverse().join('')) > BigInt(right)) {
    return left + left.split('').reverse().join('');
  }
  let tmp = increment(left);
  return tmp + tmp.split('').reverse().join('');
}

function nextPalindrome(n) {
  if (n < 0n) return 0n;
  let a = n.toString();
  if (a === a.split('').reverse().join('')) return n;
  if (a.length % 2 === 0) {
    return BigInt(handleEven(a));
  }
  return BigInt(handleOdd(a));
}

function listPalindromesInRange(range) {
  let [n1, n2] = range;
  let res = [];
  while (n1 <= n2) {
    n1 = nextPalindrome(n1);
    res.push(n1);
    n1 += 1n;
  }
  if (res.length > 0 && res[res.length - 1] > n2) {
    res.pop();
  }
  return res;
}

export function listPalindromes(ranges) {
  let res = [];
  for (let range of ranges) {
    res = [...res, ...listPalindromesInRange(range)]
  }
  return res;
}