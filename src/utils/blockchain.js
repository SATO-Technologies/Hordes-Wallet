export const satToMsat = (sat = 0) => {
  return sat * 1000;
}

export const msatToSat = (msat = 0) => {
  return Math.floor(msat / 1000);
}

export const satsToBtc = (sat = 0) => {
  return sat / 100000000;
}

export const btcToSat = (btc = 0) => {
  return btc * 100000000;
}
