/* modules */
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { NativeModules, Alert } from 'react-native';
import VersionNumber from 'react-native-version-number';
import JSONbig from 'json-bigint';

/* crypto modules */
import RNFS from 'react-native-fs';
import * as bitcoin from 'bitcoinjs-lib';
import CryptoJS from 'crypto-js';
import * as bip39 from 'bip39';
import { bip32, ECPair } from 'managers/ecc.tsx';

/* native modules */
const WalletDevKit = NativeModules.WalletDevKit;

/* managers */
import hordesApi from 'managers/hordes';
import ordinalsApi from 'managers/ordinals';
import mempoolApi from 'managers/mempool';
import { estimatePsbtSize, calculateChangeValue } from 'managers/psbt';

/* libs */
import { findFromKnownRanges as findRareSats } from 'libs/raresats/commands/find';

/* utils */
import { getItem, saveItem, deleteItem } from 'utils/storage';
import { getFromDB, saveToDB, deleteDB } from 'utils/realm';
import { satToMsat, msatToSat, satsToBtc } from 'utils/blockchain';
import { numberFormat } from 'utils/number';
import { sortInscriptions } from 'utils/ordinals';
import { parseSatribute } from 'utils/satributes';

const JSONbigNative = JSONbig({ useNativeBigInt: true, alwaysParseAsBig: true });

export const WalletContext = createContext({ });

export default function WalletProvider({ children }) {

  /* refs */
  const loadingWalletRef = useRef(false);
  const accessTokenRef = useRef(null);
  const publicKeyRef = useRef(null);

  /* contants */
  const DUMMY_UTXO_VALUE = 1000;
  const INSCRIPTION_UTXO_VALUE = 600;
  const DUST_VALUE = 330;

  /* states */
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState({
    ordinals: null,
    payments: null
  });
  const [publicKey, setPublicKey] = useState({
    ordinals: null,
    payments: null
  });
  const [balance, setBalance] = useState(0);
  const [unconfirmedBalance, setUnconfirmedBalance] = useState(0);
  const [dummyBalance, setDummyBalance] = useState(0);
  const [ordinalsBalance, setOrdinalsBalance] = useState(0);
  const [raresatsBalance, setRaresatsBalance] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [utxos, setUtxos] = useState({});
  const [parsedUtxos, setParsedUtxos] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [inscriptionsWithCollection, setInscriptionsWithCollection] = useState({});
  const [inscriptionsWithoutCollection, setInscriptionsWithoutCollection] = useState([]);
  const [raresats, setRaresats] = useState({});

  const [status, setStatus] = useState('UNKNOWN_STATUS'); // UNKNOWN_STATUS - WALLET_NOT_INITIALIZED - WALLET_LOCKED - WALLET_READY

  /* effects */
  useEffect(() => {

    switch (status) {
      case 'UNKNOWN_STATUS':
        if( loadingWalletRef.current == false ) loadWallet();
        break;
    }

  }, [status, wallet]);

  useEffect(() => {

    if( status == 'WALLET_READY' ) {
      const doAsyncRequest = async () => {
        await saveItem('address', JSON.stringify(address));
      }
      doAsyncRequest();
    }

  }, [status, address]);

  useEffect(() => {

    if( status == 'WALLET_READY' ) {
      const doAsyncRequest = async () => {
        await saveItem('publicKey', JSON.stringify(publicKey));
      }
      doAsyncRequest();
    }

  }, [status, publicKey]);

  useEffect(() => {

    if( status == 'WALLET_READY' ) {
      const doAsyncRequest = async () => {
        await saveItem('balance', `${balance}`);
      }
      doAsyncRequest();
    }

  }, [status, balance]);

  useEffect(() => {

    if( status == 'WALLET_READY' ) {
      const doAsyncRequest = async () => {
        await saveItem('unconfirmedBalance', `${unconfirmedBalance}`);
      }
      doAsyncRequest();
    }

  }, [status, unconfirmedBalance]);

  useEffect(() => {

    if( status == 'WALLET_READY' ) {
      const doAsyncRequest = async () => {
        await saveItem('dummyBalance', `${dummyBalance}`);
      }
      doAsyncRequest();
    }

  }, [status, dummyBalance]);

  useEffect(() => {

    if( status == 'WALLET_READY' ) {
      const doAsyncRequest = async () => {
        await saveItem('ordinalsBalance', `${ordinalsBalance}`);
      }
      doAsyncRequest();
    }

  }, [status, ordinalsBalance]);

  useEffect(() => {

    let calculateBalance = 0;
    getUtxos({ address: address.payments, filter: 'funds' }).map((funds) => {
      calculateBalance += funds.value;
    });
    setBalance(calculateBalance);

    let calculateUnconfirmedBalance = 0;
    getUtxos({ address: address.payments, filter: 'unconfirmed' }).map((funds) => {
      calculateUnconfirmedBalance += funds.value;
    });
    setUnconfirmedBalance(calculateUnconfirmedBalance);

    let calculateDummyBalance = 0;
    getUtxos({ address: address.payments, filter: 'dummies' }).map((funds) => {
      calculateDummyBalance += funds.value;
    });
    setDummyBalance(calculateDummyBalance);

    let calculateOrdinalsBalance = 0;
    getUtxos({ address: address.ordinals, filter: 'funds' }).map((funds) => {
      calculateOrdinalsBalance += funds.value;
    });
    setOrdinalsBalance(calculateOrdinalsBalance);

    let calculateRaresatsBalance = 0;
    getUtxos({ address: address.ordinals, filter: 'raresats' }).map((funds) => {
      calculateRaresatsBalance += funds.value;
    });
    setRaresatsBalance(calculateRaresatsBalance);

    let parsedUtxos = [];
    let utxosByOutpoint = { };
    Object.keys(utxos[address.ordinals] || {}).map((key) => {
      utxos[address.ordinals][key].forEach((u, i) => {
        let outpoint = `${u.txid}:${u.vout}`;
        if( !utxosByOutpoint[outpoint] ) {
          utxosByOutpoint[outpoint] = u;
        } else {
          utxosByOutpoint[outpoint] = { ...utxosByOutpoint[outpoint], ...u }
        }
      });
    });
    Object.keys(utxosByOutpoint).map((outpoint) => {
      parsedUtxos.push(utxosByOutpoint[outpoint]);
    });
    setParsedUtxos(parsedUtxos.sort((a, b) => {
      return b.timestamp - a.timestamp;
    }));

  }, [status, utxos, address]);

  useEffect(() => {

    let inscriptionsWithCollectionList = { };
    let inscriptionsWithoutCollectionList = [];
    for( const inscription of inscriptions ) {
      let slug = inscription.collection?.slug;
      let name = inscription.collection?.name;
      if( slug && name ) {
        if( !inscriptionsWithCollectionList[name] ) inscriptionsWithCollectionList[name] = {
          slug: slug,
          name: name,
          inscriptions: []
        };
        inscriptionsWithCollectionList[name].inscriptions.push(inscription);
      } else {
        inscriptionsWithoutCollectionList.push(inscription);
      }
    }

    let sortedInscriptionWithCollectionListKeys = Object.keys(inscriptionsWithCollectionList).sort();
    let sortedInscriptionWithCollectionList = {};
    sortedInscriptionWithCollectionListKeys.forEach((key) => {
      sortedInscriptionWithCollectionList[key] = { ...inscriptionsWithCollectionList[key] }
      sortedInscriptionWithCollectionList[key].inscriptions = sortInscriptions(inscriptionsWithCollectionList[key].inscriptions);
    });

    setInscriptionsWithCollection(sortedInscriptionWithCollectionList);
    setInscriptionsWithoutCollection(sortInscriptions(inscriptionsWithoutCollectionList));

  }, [inscriptions]);

  /* actions */
  const loadWallet = async () => {

    loadingWalletRef.current = true;

    /* initialize wallet dev kit */
    await WalletDevKit.setNetwork('bitcoin');
    await WalletDevKit.setBlockchain('electrum', 'ssl://electrum.blockstream.info:60002');

    /* migrate if needed */
    let oldWalletsFromDB = await getItem('wallets', 'satowalletstorage');
    if( oldWalletsFromDB ) oldWalletsFromDB = JSON.parse(oldWalletsFromDB);
    if( oldWalletsFromDB ) {
      let oldAccountFromDB = await getItem('account', 'satowalletstorage');
      if( oldAccountFromDB ) oldAccountFromDB = JSON.parse(oldAccountFromDB);

      if( oldAccountFromDB ) {
        let oldWallet = oldWalletsFromDB.wallets[0];
        let newWallet = {
          id: oldWallet.id,
          mnemonic: oldWallet.mnemonic,
          derivationPath: oldWallet.derivationPath
        }

        /* save locally sensitive data encrypted */
        await saveItem('wallet', newWallet);
        setWallet(newWallet);

        /* delete old data */
        await deleteItem('wallets', 'satowalletstorage');
        await deleteItem('account', 'satowalletstorage');

        /* initialize wallet */
        await initializeWallet({
          id: newWallet.id,
          mnemonic: CryptoJS.AES.decrypt(newWallet.mnemonic, oldAccountFromDB.passcode).toString(CryptoJS.enc.Utf8),
          derivationPath: newWallet.derivationPath,
        });

        return

      }
    }

    /* load wallet from local db */
    let walletFromDB = await getItem('wallet');
    if( walletFromDB ) walletFromDB = JSON.parse(walletFromDB);
    if( walletFromDB && walletFromDB.mnemonic ) {

      setWallet(walletFromDB);
      setStatus('WALLET_LOCKED');

      /* load balance */
      let accessTokenFromDB = await getItem('access_token');
      if( accessTokenFromDB ) {
        accessTokenRef.current = accessTokenFromDB;
        global.access_token = accessTokenFromDB;
      }

      /* load balance */
      let balanceFromDB = await getItem('balance');
      if( balanceFromDB ) setBalance(+balanceFromDB);

      /* load unconfirmed balance */
      let unconfirmedBalanceFromDB = await getItem('unconfirmedBalance');
      if( unconfirmedBalanceFromDB ) setBalance(+unconfirmedBalanceFromDB);

      /* load ordinals balance */
      let ordinalsBalanceFromDB = await getItem('ordinalsBalance');
      if( ordinalsBalanceFromDB ) setOrdinalsBalance(+ordinalsBalanceFromDB);

      /* load address */
      let addressFromFB = await getItem('address');
      if( addressFromFB ) setAddress(JSON.parse(addressFromFB));

      /* load address */
      let publicKeyFromDB = await getItem('publicKey');
      if( publicKeyFromDB ) {
        publicKeyFromDB = JSON.parse(publicKeyFromDB)
        setPublicKey(publicKeyFromDB);
        publicKeyRef.current = publicKeyFromDB;
      }

    } else {
      setStatus('WALLET_NOT_INITIALIZED');
    }

  }

  const initializeWallet = async ({ id, mnemonic, derivationPath, updateAccount = null }) => {

    try {

      /* local fetch */
      await localFetch({ id });

      setStatus('WALLET_STARTING');

      let xprv = await WalletDevKit.importExtendedKey(mnemonic, '');
      if( !xprv ) {
        Alert.alert('Hordes', 'Unable to generate extended key')
        return
      }

      let descriptor = createDescriptor({ xprv: xprv, purpose: derivationPath.purpose, coinType: derivationPath.coinType, account: derivationPath.account, change: derivationPath.change, addressIndex: derivationPath.addressIndex });
      let changeDescriptor = createDescriptor({ xprv: xprv, purpose: derivationPath.purpose, coinType: derivationPath.coinType, account: derivationPath.account, change: 1, addressIndex: derivationPath.addressIndex });
      if( !descriptor || !changeDescriptor ) {
        Alert.alert('Hordes', 'Unable to generate descriptors')
        return
      }

      let walletCreated = await WalletDevKit.createWallet(id, descriptor, changeDescriptor, 'sqlite', `${RNFS.DocumentDirectoryPath}/bdk`);
      if( walletCreated == true ) {

        /* generate addresses */
        let ordinalsAddress = await WalletDevKit.getAddressByIndex(id, 0, true);
        let paymentsAddress = await WalletDevKit.getAddressByIndex(id, 1, true);
        setAddress({
          ordinals: ordinalsAddress?.address,
          payments: paymentsAddress?.address
        });

        /* create account if needed */
        if( !accessTokenRef.current ) {
          let account = await hordesApi.account.create({ id: ordinalsAddress?.address, app: global.app, profile: updateAccount == null ? false : true });
          if( account && account.token ) {
            await saveItem('access_token', account.token);
            accessTokenRef.current = account.token;
            global.access_token = account.token;
            if( account.profile ) {
              if( account.profile.socials && account.profile.socials.webs ) account.profile.socials.webs.push({ value: '', visible: false })
              await updateAccount('profile', account.profile)
            }
          }
        }

        /* update account */
        hordesApi.account.update({
          [`walletInfo.${global.app}.address`]: {
            ordinals: ordinalsAddress?.address,
            payments: paymentsAddress?.address
          },
          [`appInfo.${global.app}.version`]: `${VersionNumber.appVersion}`,
          [`appInfo.${global.app}.build`]: parseInt(VersionNumber.buildVersion)
        });

        /* sync */
        await sync({ id });

        /* generate pub keys */
        if( publicKeyRef.current?.requestedAt == null ) {
          const seed = await bip39.mnemonicToSeed(mnemonic);
          const node = bip32.fromSeed(seed);

          const ordinalsAddressWif = node.derivePath(`${buildDerivationPath(derivationPath)}`).toWIF();
          const ordinalsSigner = ECPair.fromWIF(ordinalsAddressWif);
          const ordinalsPubKey = ordinalsSigner.publicKey.toString('hex');

          const paymentsAddressWif = node.derivePath(`${buildDerivationPath({ ...derivationPath, addressIndex: 1 })}`).toWIF();
          const paymentsSigner = ECPair.fromWIF(paymentsAddressWif);
          const paymentsPubKey = paymentsSigner.publicKey.toString('hex');

          setPublicKey({
            ordinals: ordinalsPubKey,
            payments: paymentsPubKey,
            requestedAt: +new Date()
          });
        }

      } else {
        Alert.alert('Hordes', 'Unable to create wallet')
      }

    } catch (error) {
      Alert.alert('Hordes Init Wallet', error.message)
    }

  }

  const deleteWallet = async () => {
    setStatus('WALLET_NOT_INITIALIZED');
    setWallet(null);
    setAddress({
      ordinals: null,
      payments: null
    });
    setPublicKey({
      ordinals: null,
      payments: null
    });
    setBalance(0);
    setUnconfirmedBalance(0);
    setOrdinalsBalance(0);
    setTransactions([]);
    setUtxos({});
    setInscriptions([]);
    setInscriptionsWithCollection({})
    setInscriptionsWithoutCollection([]);

    await deleteItem('wallet');
    await deleteItem('address');
    await deleteItem('publicKey');
    await deleteItem('balance');
    await deleteItem('unconfirmedBalance');
    await deleteItem('ordinalsBalance');
    await deleteItem('access_token');

    accessTokenRef.current = null;

    global.access_token = null;

    await deleteDB();
  }

  /* wallet dev kit */
  const typeForPorpuse = ({ purpose }) => {
    let type = 'tr';
    switch (+purpose) {
      case 44:
      case 84:
        type = 'wpkh';
        break;
    }
    return type;
  }

  const buildDerivationPath = (path) => {
    const {
      purpose,
      coinType,
      account,
      change,
      addressIndex
    } = path;
    let derivationPath = `m/${purpose}`;
    if( coinType && coinType != '' ) {
      derivationPath += `'/${coinType}`;
      if( account && account != '' ) {
        derivationPath += `'/${account}`;
        if( change && change != '' ) {
          derivationPath += `'/${change}`;
          if( addressIndex && addressIndex != '' ) {
            derivationPath += `/${addressIndex == '*' ? '0' : addressIndex}`;
          }
        }
      }
    }
    return derivationPath;
  }

  const createDescriptor = ({ xprv, purpose, coinType, account, change, addressIndex = '*' }) => {
    try {
      let descriptor = `${typeForPorpuse({ purpose })}(${xprv.replace('/*', '')}/${purpose}`
      if( coinType && coinType != '' ) {
        descriptor += `'/${coinType}`;
        if( account && account != '' ) {
          descriptor += `'/${account}`;
          if( change && change != '' ) {
            descriptor += `'/${change}`;
            if( addressIndex && addressIndex != '' ) {
              descriptor += `/${addressIndex}`;
            }
          }
        }
      }
      descriptor += `)`;
      return descriptor;
    } catch (error) {
      Alert.alert('Hordes', error.message)
      return null
    }
  }

  const localFetch = async ({ id }) => {

    /* utxos */
    let localUtxosFound = await getFromDB({ schema: 'UTXOS', walletId: id });
    if( localUtxosFound ) setUtxos(localUtxosFound);

    /* transactions */
    let localTransactionsFound = await getFromDB({ schema: 'TRANSACTIONS', walletId: id });
    if( localTransactionsFound ) setTransactions(localTransactionsFound);

    /* inscriptions */
    let localInscriptionsFound = await getFromDB({ schema: 'INSCRIPTIONS', walletId: id });
    if( localInscriptionsFound ) setInscriptions(localInscriptionsFound);

    /* inscriptions */
    let localRaresatsFound = await getFromDB({ schema: 'RARE_SATS', walletId: id });
    if( localRaresatsFound ) setRaresats(localRaresatsFound);

  }

  const sync = async ({ id }) => {
    setStatus('WALLET_SYNCING');
    try {
      await WalletDevKit.sync(id);
      await fetchWallet({ id });
    } catch (error) {
      Alert.alert('Hordes Sync', error.message);
    }
  }

  const fetchWallet = async ({ id }) => {
    try {

      /* temp */
      let utxosWithInscriptions = 0;
      let utxosWithInscriptionsData = 0;

      let utxosFound = { }
      let inscriptionsFound = [];
      let transactionsFound = []

      /* wallet ordinals address */
      let ordinalsAddress = await WalletDevKit.getAddressByIndex(id, 0, true);

      /* local uxos with inscriptions */
      let localUtxosWithInscriptionsFound = await getFromDB({ schema: 'UTXOS_INSCRIPTIONS', walletId: id });

      /* local inscriptions data */
      let localInscriptionsFound = await getFromDB({ schema: 'INSCRIPTIONS', walletId: id });

      /* wallet transactions */
      let transactions = await WalletDevKit.getTransactions(id);

      /* wallet utxos */
      let unspentTransactions = await WalletDevKit.listUnspent(id);

      /* check rare sats ub utxos */
      let utxosWithRareSats = {};
      let utxosWithPossibleRareSats = [];
      let outpoints = [];
      let utxosValues = {};
      unspentTransactions.forEach((utxo) => {
        outpoints.push(`${utxo.txid}:${utxo.vout}`);
        utxosValues[`${utxo.txid}:${utxo.vout}`] = utxo.value;
      });

      let serverStatus = await hordesApi.server.status();

      if( serverStatus && serverStatus.height && serverStatus.height > 0 ) {
        let outpointToRanges = await hordesApi.raresats.search({ outpoints: outpoints });
        if( outpointToRanges ) outpointToRanges = JSONbigNative.parse(outpointToRanges);
        if( outpointToRanges == null ) outpointToRanges = { }
        Object.keys(outpointToRanges).map((outpoint) => {
          if( outpointToRanges[outpoint]?.length == 0 ) {
            utxosWithPossibleRareSats.push(outpoint);
          }
        });

        let raresatsInOutpoints = await findRareSats({ utxos: outpoints.filter((o) => Object.keys(outpointToRanges).includes(o)), outpointToRanges: outpointToRanges, utxosValues: utxosValues });
        if( raresatsInOutpoints && raresatsInOutpoints.success == true && raresatsInOutpoints.result['utxos'] ) {
          let raresatsFound = {};
          Object.keys(raresatsInOutpoints.result['utxos']).map((outpoint) => {
            Object.keys(raresatsInOutpoints.result['utxos'][outpoint].count).map((name) => {

              let parsedSat = parseSatribute(name);

              if( !utxosWithRareSats[outpoint] ) utxosWithRareSats[outpoint] = { }
              if( !utxosWithRareSats[outpoint][parsedSat] ) utxosWithRareSats[outpoint][parsedSat] = { }
              utxosWithRareSats[outpoint][parsedSat] = parseInt(raresatsInOutpoints.result['utxos'][outpoint].count[name]);

              if( !raresatsFound[parsedSat] ) raresatsFound[parsedSat] = { count: BigInt(0), sats: 0, utxos: [] }
              raresatsFound[parsedSat].count += raresatsInOutpoints.result['utxos'][outpoint].count[name];
              // raresatsFound[parsedSat].sats += raresatsInOutpoints.result['utxos'][outpoint].utxoValue;

            });
          });
          setRaresats(raresatsFound);
          await saveToDB({ schema: 'RARE_SATS', walletId: id, data: raresatsFound });
        }
      } else {
        unspentTransactions.forEach((utxo) => {
          utxosWithPossibleRareSats.push(`${utxo.txid}:${utxo.vout}`);
        });
      }

      /* split utxos in categories */
      for( const utxo of unspentTransactions ) {
        if( !utxosFound[utxo.address] ) utxosFound[utxo.address] = {
          funds: [],
          inscriptions: [],
          raresats: [],
          dummies: [],
          dusts: [],
          unconfirmed: []
        }

        let localUtxoInscriptionsIds = localUtxosWithInscriptionsFound.find((utxoWithInscriptions) => utxoWithInscriptions.txid == utxo.txid && utxoWithInscriptions.vout == utxo.vout)?.inscriptionsIds;
        if( localUtxoInscriptionsIds ) console.log(`UTXO WITH INSCRIPTIONS IDS DATA WITH LOCAL`)
        let inscriptionsIds = localUtxoInscriptionsIds;
        if( !inscriptionsIds ) {
          inscriptionsIds = await ordinalsApi.utxo.getInscriptionsIds({ txid: utxo.txid, vout: utxo.vout });
          if( inscriptionsIds ) console.log(`UTXO WITH INSCRIPTIONS IDS DATA WITH API`)
        }
        if( inscriptionsIds && inscriptionsIds.length > 0 ) {

          if( !localUtxoInscriptionsIds ) {
            localUtxosWithInscriptionsFound.push({ txid: utxo.txid, vout: utxo.vout, inscriptionsIds: inscriptionsIds });
            console.log(`NEW UTXO WITH INSCRIPTIONS IDS`)
          }

          utxosWithInscriptions += inscriptionsIds.length;

          utxo.inscriptionsIds = inscriptionsIds;
          utxosFound[utxo.address].inscriptions.push(utxo);

          for( const inscriptionId of inscriptionsIds ) {
            let inscription = localInscriptionsFound.find((i) => i.id == inscriptionId);
            if( inscription && inscription.lastFetch && (+new Date() - inscription.lastFetch) < 86400000 ) {
              console.log(`INSCRIPTION ${inscriptionId} DATA WITH LOCAL`)
            } else {
              inscription = await ordinalsApi.inscription.get({ id: inscriptionId });
              if( inscription ) console.log(`INSCRIPTION ${inscriptionId} DATA WITH API`)
            }
            if( inscription ) {
              utxosWithInscriptionsData += 1;
              inscription.lastFetch = +new Date();
              inscriptionsFound.push(inscription);
            }
          }
        }

        let confirmed = false;
        let tx = transactions.find((tx) => { return tx.txid == utxo.txid });
        if( tx ) {
          if( tx.confirmed == true ) confirmed = true;
          utxo.timestamp = tx.timestamp;
        }
        if( utxo.address == ordinalsAddress.address ) {
          if( utxosWithPossibleRareSats.includes(`${utxo.txid}:${utxo.vout}`) ) {
            utxo.locked = true;
            utxosFound[utxo.address].funds.push(utxo);
          } else {
            if( utxosWithRareSats[`${utxo.txid}:${utxo.vout}`] ) {
              utxo.raresats = utxosWithRareSats[`${utxo.txid}:${utxo.vout}`];
              utxosFound[utxo.address].raresats.push(utxo);
            } else {
              if( utxo.inscriptionsIds == null && utxo.raresats == null ) {
                if( confirmed == false ) {
                  utxosFound[utxo.address].unconfirmed.push(utxo);
                } else {
                  utxosFound[utxo.address].funds.push(utxo);
                }
              }
            }
          }
        } else {
          if( confirmed == false ) {
            utxosFound[utxo.address].unconfirmed.push(utxo);
          } else {
            if( utxo.value <= 1000 ) {
              utxosFound[utxo.address].dummies.push(utxo);
            } else {
              utxosFound[utxo.address].funds.push(utxo);
            }
          }
        }
      }

      await saveToDB({ schema: 'UTXOS_INSCRIPTIONS', walletId: id, data: localUtxosWithInscriptionsFound });

      setUtxos(utxosFound);
      await saveToDB({ schema: 'UTXOS', walletId: id, data: utxosFound });

      if( utxosWithInscriptions == utxosWithInscriptionsData ) {
        setInscriptions(sortInscriptions(inscriptionsFound));
        await saveToDB({ schema: 'INSCRIPTIONS', walletId: id, data: inscriptionsFound });
      } else {
        Alert.alert('Hordes', 'Unable to fetch all inscriptions data');
      }

      for( const tx of transactions ) {
        if( tx.timestamp == 0 ) tx.timestamp = parseInt((+new Date()) / 1000);
        if( tx.confirmed == false ) {
          transactionsFound.push(tx);
          continue;
        }

        tx.inscriptions = [];

        let inscription = inscriptionsFound.find((inscription) => { return inscription.id?.includes(tx.txid) });
        if( inscription ) {
          tx.inscriptions.push({ id: inscription.id, content_type: inscription.content_type });
        } else {
          let vout = 0;
          for( const output of tx.outputs ) {
            inscription = inscriptionsFound.find((inscription) => { return inscription.id == `${tx.txid}i${vout}` });
            if( inscription ) {
              tx.inscriptions.push({ id: inscription.id, content_type: inscription.content_type });
            } else {
              let inscriptionsIdsFromOutput = await ordinalsApi.utxo.getInscriptionsIds({ txid: tx.txid, vout: vout });
              if( inscriptionsIdsFromOutput && inscriptionsIdsFromOutput.length > 0 ) {
                for( const inscriptionId of inscriptionsIdsFromOutput ) {
                  tx.inscriptions.push({ id: inscriptionId, content_type: null });
                }
              }
            }
            vout++;
          }
        }

        transactionsFound.push(tx);
      }

      transactionsFound = transactionsFound.sort((a, b) => {
        return b.timestamp - a.timestamp;
      });

      setTransactions(transactionsFound);
      await saveToDB({ schema: 'TRANSACTIONS', walletId: id, data: transactionsFound });

      setStatus('WALLET_READY');

    } catch (error) {
      Alert.alert('Hordes Fetch Wallet', error.message)
    }
  }

  /* wallet */
  const getUtxos = ({ address, filter }) => {
    if( utxos[address] && utxos[address][filter] ) return utxos[address][filter].filter((u) => u.isSpent == false);
    return [];
  }

  const createPsbtToSendBitcoin = async ({ sourceAddress = null, destinationAddress, amount, satsPerVbyte, extractTxSizeOnly = false, extractInputsAndOutputsOnly = false, utxos = [] }) => {

    /* variables */
    const inputs = [];

    /* init PSBT */
    let psbt = new bitcoin.Psbt({ network: bitcoin.networks[global.network] });

    /* inputs */
    for( const utxo of utxos ) {
      try {
        const selectedTx = bitcoin.Transaction.fromHex(await mempoolApi.getTxHexById({ txid: utxo.txid }));
        for( const output in selectedTx.outs ) {
          try { selectedTx.setWitness(parseInt(output), []) } catch { };
        }
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: selectedTx.toBuffer(),
          witnessUtxo: selectedTx.outs[utxo.vout]
        });
        inputs.push({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value
        });
      } catch (e) { }
    }

    for( const fundsUtxo of getUtxos({ address: sourceAddress || address.payments, filter: 'funds' }) ) {
      try {
        const fundsTx = bitcoin.Transaction.fromHex(await mempoolApi.getTxHexById({ txid: fundsUtxo.txid }));
        for( const output in fundsTx.outs ) {
          try { fundsTx.setWitness(parseInt(output), []) } catch { };
        }
        psbt.addInput({
          hash: fundsUtxo.txid,
          index: fundsUtxo.vout,
          nonWitnessUtxo: fundsTx.toBuffer(),
          witnessUtxo: fundsTx.outs[fundsUtxo.vout]
        });
        inputs.push({
          txid: fundsUtxo.txid,
          vout: fundsUtxo.vout,
          value: fundsUtxo.value
        });
      } catch (e) { }
    }

    /* outputs */
    if( utxos.length > 0 ) {
      for( const utxo of utxos ) {
        psbt.addOutput({
          address: destinationAddress,
          value: utxo.value
        });
      }
    } else {
      psbt.addOutput({
        address: destinationAddress,
        value: amount
      });
    }

    let size = estimatePsbtSize({ inputs: psbt.data.inputs, outputs: psbt.txOutputs });
    if( size > 0 ) {
      if( extractTxSizeOnly == true ) {
        return size;
      } else {
        let changeValue = calculateChangeValue({ inputs: psbt.data.inputs, outputs: psbt.txOutputs, fee: size * satsPerVbyte });
        if( changeValue < 0 ) return 'INSUFFICIENT_FUNDS';
        if( changeValue > 0 ) {
          psbt.addOutput({
            address: address.payments,
            value: changeValue
          });
        }

        if( extractInputsAndOutputsOnly == true ) {
          return { inputs: inputs, outputs: psbt.txOutputs };
        }

        return psbt;
      }
    } else {
      return null;
    }

  }

  const signPsbt = async ({ base64Psbt, extractTx = false }) => {
    try {
      return await WalletDevKit.signPsbt(wallet.id, base64Psbt, extractTx);
    } catch (error) {
      Alert.alert('Hordes', error.message)
    }
  }

  const signAndBroadcastPsbt = async ({ base64Psbt }) => {
    try {
      return await WalletDevKit.signAndBroadcastPsbt(wallet.id, base64Psbt);
    } catch (error) {
      Alert.alert('Hordes', error.message)
    }
  }

  /* wallet - inscriptions */
  const createPsbtToTransferInscription = async ({ inscription, destinationAddress, satsPerVbyte, extractTxSizeOnly = false }) => {

    /* init PSBT */
    let psbt = new bitcoin.Psbt({ network: bitcoin.networks[global.network] });

    /* validate transfer */
    let numberOfInscription = getUtxos({ address: address.payments, filter: 'inscriptions' }).filter((u) => { return u.inscriptionsIds?.includes(inscription.id) }).length;
    if( numberOfInscription > 1 ) {
      Alert.alert('Hordes', 'At this moment we only support the existence of a single inscription in an utxo')
      return null;
    } else {
      if( inscription.sat_offset == 0 ) {
        psbt = await completePsbtForNormalizedInscription({ psbt: psbt, inscription: inscription, destinationAddress: destinationAddress });
      } else {
        Alert.alert('Hordes', `At this moment we only support the transfer of an inscription at offset 0, ${inscription.id} is at offset ${inscription.sat_offset}`);
        return null;
      }
    }

    for( const fundsUtxo of getUtxos({ address: address.payments, filter: 'funds' }) ) {
      try {
        const fundsTx = bitcoin.Transaction.fromHex(await mempoolApi.getTxHexById({ txid: fundsUtxo.txid }));
        for( const output in fundsTx.outs ) {
          try { fundsTx.setWitness(parseInt(output), []) } catch { };
        }
        psbt.addInput({
          hash: fundsUtxo.txid,
          index: fundsUtxo.vout,
          nonWitnessUtxo: fundsTx.toBuffer(),
          witnessUtxo: fundsTx.outs[fundsUtxo.vout]
        });
      } catch { }
    }

    let size = estimatePsbtSize({ inputs: psbt.data.inputs, outputs: psbt.txOutputs });
    if( size > 0 ) {
      if( extractTxSizeOnly == true ) {
        return size;
      } else {
        let changeValue = calculateChangeValue({ inputs: psbt.data.inputs, outputs: psbt.txOutputs, fee: size * satsPerVbyte });
        if( changeValue < 0 ) return 'INSUFFICIENT_FUNDS';
        psbt.addOutput({
          address: address.payments,
          value: changeValue
        });
        return psbt;
      }
    } else {
      return null;
    }

  }

  const completePsbtForNormalizedInscription = async ({ psbt, inscription, destinationAddress }) => {

    /* inputs */
    try {
      const inscriptionTx = bitcoin.Transaction.fromHex(await mempoolApi.getTxHexById({ txid: inscription.txid }))
      for( const output in inscriptionTx.outs ) {
        try { inscriptionTx.setWitness(parseInt(output), []) } catch { };
      }
      psbt.addInput({
        hash: inscription.txid,
        index: inscription.vout,
        nonWitnessUtxo: inscriptionTx.toBuffer(),
        witnessUtxo: inscriptionTx.outs[inscription.vout]
      });
    } catch { }

    /* outputs */
    psbt.addOutput({
      address: destinationAddress,
      value: inscription.outputValue
    });

    return psbt;

  }

  /* provider */
  const states = {
    wallet,
    status,
    address,
    publicKey,
    balance,
    unconfirmedBalance,
    dummyBalance,
    ordinalsBalance,
    raresatsBalance,
    inscriptions,
    inscriptionsWithCollection,
    inscriptionsWithoutCollection,
    utxos,
    transactions,
    raresats
  }
  const actions = {
    initializeWallet,
    deleteWallet,
    setWallet,
    setStatus,
    sync,
    fetchWallet,
    parsedUtxos,
    buildDerivationPath,
    createPsbtToSendBitcoin,
    signPsbt,
    signAndBroadcastPsbt,
    createPsbtToTransferInscription
  }
  return (
    <WalletContext.Provider value={{ ...states, ...actions }}>
      {children}
    </WalletContext.Provider>
  );

}

export const useWallet = () => useContext(WalletContext);
