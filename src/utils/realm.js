import Realm from 'realm';
import * as bitcoin from 'bitcoinjs-lib';
import { REALM_ENCRYPTION_KEY } from '@env';

/* variables */
const schemaProperties = {
  UTXOS: {
    walletId: 'string',
    data: 'string'
  },
  UTXOS_INSCRIPTIONS: {
    walletId: 'string',
    data: 'string'
  },
  TRANSACTIONS: {
    walletId: 'string',
    data: 'string'
  },
  INSCRIPTIONS: {
    walletId: 'string',
    data: 'string'
  },
  RARE_SATS: {
    walletId: 'string',
    data: 'string'
  }
}

const getRealm = async (name) => {
  const password = bitcoin.crypto.sha256(Buffer.from(REALM_ENCRYPTION_KEY)).toString('hex');
  const buf = Buffer.from(password + password, 'hex');
  const encryptionKey = Int8Array.from(buf);
  const schema = [{
    name: name,
    properties: schemaProperties[name]
  }];
  return await Realm.open({ schema: schema, path: `${name.toLowerCase()}.realm`, encryptionKey: encryptionKey, deleteRealmIfMigrationNeeded: true });
}

export const getFromDB = async ({ schema, walletId }) => {
  let realmSchema = await getRealm(schema);
  let data = realmSchema.objects(schema).filtered(`walletId = '${walletId}'`);
  if( data && data[0] ) return JSON.parse(data[0].data);
  return [];
}

export const saveToDB = async ({ schema, walletId, data }) => {
  let realmSchema = await getRealm(schema);
  realmSchema.write(() => {
    realmSchema.delete(realmSchema.objects(schema).filtered(`walletId = '${walletId}'`));
    realmSchema.create(schema, {
      walletId: walletId,
      data: JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value)
    }, Realm.UpdateMode.Modified);
  });
  realmSchema.close();
}

export const deleteDB = async () => {
  let schemas = Object.keys(schemaProperties);
  for( const schema of schemas ) {
    let realmSchema = await getRealm(schema);
    realmSchema.write(() => {
      realmSchema.delete(realmSchema.objects(schema));
    });
    realmSchema.close();
  }
}
