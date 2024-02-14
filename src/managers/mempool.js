/* global */
let txByIdCache = { };
let txHexByIdCache = { };

export default {

  getAddressBalance: async ({ address }) => {
    try {
      let response = await fetch(`https://mempool.space/api/address/${address}/utxo`);
      response = await response.json();
      if( response ) return response.reduce((a, b) => {
        return a + b.value;
      }, 0);
    } catch { }
    return 0;
  },
  getTransactions: async ({ address }) => {
    try {
      let response = await fetch(`https://mempool.space/api/address/${address}/txs`);
      response = await response.json();
      return response;
    } catch { }
    return [];
  },
  listUnspent: async ({ address }) => {
    try {
      let response = await fetch(`https://mempool.space/api/address/${address}/utxo`);
      response = await response.json();
      return response;
    } catch { }
    return [];
  },
  getTxById: async ({ txid }) => {
    if( !txByIdCache[txid] ) {
      try {
        let response = await fetch(`https://mempool.space/api/tx/${txid}`);
        response = await response.json();
        if( response ) txByIdCache[txid] = response;
      } catch { }
    }
    return txByIdCache[txid];
  },
  getTxHexById: async ({ txid }) => {
    if( !txHexByIdCache[txid] ) {
      try {
        let response = await fetch(`https://mempool.space/api/tx/${txid}/hex`);
        response = await response.text();
        if( response ) txHexByIdCache[txid] = response;
      } catch { }
    }
    return txHexByIdCache[txid];
  }

}
