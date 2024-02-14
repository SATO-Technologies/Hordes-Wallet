/* modules */
import { MAGIC_EDEN_API_KEY, BASE_API_ENDPOINT_ORDINALS } from '@env';

/* utils */
import { parseSatributes } from 'utils/satributes';

export default ordinalsApi = {

  utxo: {
    getInscriptionsIds: async ({ txid, vout }) => {
      try {
        let inscriptionsIds = await fetch(`${BASE_API_ENDPOINT_ORDINALS}/utxoInscriptions.php?outpoint=${txid}:${vout}`);
        inscriptionsIds = await inscriptionsIds.json();
        return inscriptionsIds;
      } catch {
        return null;
      }
    }
  },
  inscription: {
    get: async ({ id }) => {
      let inscription = null;

      /* magic eden api */
      try {
        inscription = await fetch(`https://api-mainnet.magiceden.dev/v2/ord/btc/tokens/${id}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + MAGIC_EDEN_API_KEY
          }
        });
        inscription = await inscription.json();
        if( inscription && inscription.id ) return parseMagicEdenResponse({ type: 'inscription', data: inscription });
      } catch { }

      /* ordinals wallet api */
      try {
        inscription = await fetch(`https://turbo.ordinalswallet.com/inscription/${id}`);
        inscription = await inscription.json();
        if( inscription && inscription.id ) return inscription;
      } catch { }

      return null;
    },
    getCollection: async ({ slug }) => {
      try {
        let collection = await fetch(`https://turbo.ordinalswallet.com/collection/${slug}`);
        collection = await collection.json();
        return collection;
      } catch {
        return null;
      }
    },
    getOutpoint: async ({ id }) => {
      try {
        let outpoint = await fetch(`https://turbo.ordinalswallet.com/inscription/${id}/outpoint`);
        outpoint = await outpoint.json();
        if( outpoint && outpoint.inscription ) {
          outpoint.inscription.owner = outpoint.owner;
          let outpointBytes = Buffer.from(outpoint.inscription.outpoint, 'hex');
          let txid = outpointBytes.slice(0, 32).reverse().toString('hex')
          let vout = outpointBytes.slice(32, 36).readInt32LE(0);
          outpoint.inscription.txid = txid;
          outpoint.inscription.vout = vout;
          outpoint.inscription.output = `${txid}:${vout}`;
          outpoint.inscription.outputValue = outpoint.sats;
          return outpoint.inscription;
        }
        return null;
      } catch {
        return null;
      }
    }
  },
  collection: {
    get: async ({ slug }) => {
      let collection = null;

      /* magic eden api */
      try {
        collection = await fetch(`https://api-mainnet.magiceden.dev/v2/ord/btc/collections/${slug}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + MAGIC_EDEN_API_KEY
          }
        });
        collection = await collection.json();
        if( collection && collection.symbol ) return parseMagicEdenResponse({ type: 'collection', data: collection });
      } catch { }

      /* ordinals wallet api */
      try {
        collection = await fetch(`https://turbo.ordinalswallet.com/collection/${slug}`);
        collection = await collection.json();
        if( collection && collection.slug ) return collection;
      } catch { }

      return null;
    },
    getInscriptions: async ({ slug, numberOfInscriptions = 100 }) => {
      let inscriptions = [];

      /* ordinals wallet api */
      try {
        inscriptions = await fetch(`https://turbo.ordinalswallet.com/collection/${slug}/inscriptions`);
        inscriptions = await inscriptions.json();
        if( inscriptions && inscriptions.length > 0 ) {
          inscriptions.forEach((inscription, index) => {
            if( inscription.satributes ) inscription.satributes = parseSatributes(inscription.satributes);
          });
          return inscriptions;
        }
      } catch { }

      /* magic eden api */
      try {
        let offset = 0;
        for( const index of [...Array(parseInt(numberOfInscriptions / 100) + 1).keys()] ) {
          let batchInscriptions = await fetch(`https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=${slug}&offset=${inscriptions.length}&limit=100`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + MAGIC_EDEN_API_KEY
            }
          });
          batchInscriptions = await batchInscriptions.json();
          if( batchInscriptions && batchInscriptions.tokens && batchInscriptions.tokens.length > 0 ) inscriptions = [...inscriptions, ...batchInscriptions.tokens.map((inscription) => parseMagicEdenResponse({ type: 'inscription', data: inscription }))];
        }
      } catch { }

      return inscriptions;
    },
    getRange: async ({ slug }) => {
      try {
        let collectionStats = await fetch(`https://api-mainnet.magiceden.io/v2/ord/btc/stat?collectionSymbol=${slug}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + MAGIC_EDEN_API_KEY
          }
        });
        collectionStats = await collectionStats.json();
        if( collectionStats && collectionStats.symbol ) return {
          lowest_inscription_num: collectionStats.inscriptionNumberMin,
          highest_inscription_num: collectionStats.inscriptionNumberMax
        }
      } catch {
        return null;
      }
    },
  },
  wallet: {
    address: {
      getInscriptions: async ({ address }) => {
        try {
          let addressData = await fetch(`https://turbo.ordinalswallet.com/wallet/${address}`);
          addressData = await addressData.json();
          return addressData?.inscriptions || [];
        } catch {
          return [];
        }
      }
    }
  }

}

function parseMagicEdenResponse({ type, data }) {
  let collectionKeys = { symbol: 'slug', name: 'name', description: 'description', inscriptionIcon: 'icon_inscription', imageURI: 'icon', inscriptionNumberMin: 'lowest_inscription_num', inscriptionNumberMax: 'highest_inscription_num', supply: 'total_supply', twitterLink: 'twitter', discordLink: 'discrod', websiteLink: 'website' }
  let inscriptionKeys = { id: 'id', contentType: 'content_type', genesisTransactionBlockTime: 'created', genesisTransactionBlockHeight: 'genesis_height', inscriptionNumber: 'num', meta: 'meta', collection: 'collection', owner: 'owner', location: 'location', output: 'output', outputValue: 'outputValue', satributes: 'satributes' }

  switch (type) {
    case 'collection':
      let collection = { };
      Object.keys(collectionKeys).map((key) => {
        if( data[key] ) collection[collectionKeys[key]] = data[key];
      });
      return collection;
    case 'inscription':
      let inscription = { }
      Object.keys(inscriptionKeys).map((key) => {
        if( data[key] ) {
          inscription[inscriptionKeys[key]] = data[key];
          if( key == 'collection' ) {
            let collection = { };
            Object.keys(collectionKeys).map((collectionKey) => {
              if( data[key][collectionKey] ) collection[collectionKeys[collectionKey]] = data[key][collectionKey];
            });
            inscription[key] = collection;
          }
          if( key == 'genesisTransactionBlockTime' ) {
            inscription[inscriptionKeys[key]] = (new Date(data[key])).getTime()
          }
          if( key == 'location' ) {
            let location = data[key].split(':');
            inscription['txid'] = location[0];
            inscription['vout'] = +location[1];
            inscription['sat_offset'] = +location[2];
          }
          if( key == 'satributes' ) {
            inscription[key] = parseSatributes(inscription[key]);
          }
        }
      });
      return inscription;
    default:
      return null;
  }
}
