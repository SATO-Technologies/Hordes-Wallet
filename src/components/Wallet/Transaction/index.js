/* modules */
import { Fragment, useState, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Collapsible from 'react-native-collapsible';
import moment from 'moment';

/* components */
import Button from 'components/Button';
import InscriptionPreview from 'components/Inscription/Preview';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* managers */
import ordinalsApi from 'managers/ordinals';
import mempoolApi from 'managers/mempool';

/* utils */
import { emptyString, ellipsis } from 'utils/string';
import { numberFormat } from 'utils/number';
import { msatToSat } from 'utils/blockchain';

/* assets */
import ReceivedLogo from 'assets/svgs/received.svg';
import SentLogo from 'assets/svgs/sent.svg';
import BitcoinLogo from 'assets/svgs/btc.svg';
import SatsLogo from 'assets/svgs/sats.svg';
import SwapLogo from 'assets/svgs/swap.svg';

function TransactionDetailView({ transaction }) {

  /* navigation */
  let navigation = useNavigation();

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { address } = useWallet();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [addressFound, setAddressFound] = useState(null);

  /* effects */
  useEffect(() => {

    const doAsyncRequest = async () => {

      function getSender(tx, index, offset) {
        let offsetInTx = offset;
        for( let i = 0; i < index; i++ ) {
          offsetInTx += tx.vout[i].value
        }
        let sender = null;
        for( let i = 0; i < tx.vin.length; i++ ) {
          if( tx.vin[i].prevout.value > offsetInTx ) {
            sender = tx.vin[i].prevout.scriptpubkey_address;
            break;
          }
          offsetInTx -= tx.vin[i].value;
        }
        return sender;
      }

      let txData = await mempoolApi.getTxById({ txid: transaction.txid });
      if( txData ) {
        let found = null;
        if( transaction.type == 'RECEIVED' ) {
          txData?.vin?.forEach((vin, i) => {
            if( vin.prevout && vin.prevout.scriptpubkey_address ) {
              if( address.ordinals != vin.prevout.scriptpubkey_address && address.payments != vin.prevout.scriptpubkey_address ) found = vin.prevout.scriptpubkey_address;
            }
          });
        }
        if( transaction.type == 'SENT' ) {
          txData?.vout?.forEach((vout, i) => {
            if( vout.scriptpubkey_address ) {
              if( address.ordinals != vout.scriptpubkey_address && address.payments != vout.scriptpubkey_address ) found = vout.scriptpubkey_address;
            }
          });
        }
        setAddressFound(found);
      }
    }
    doAsyncRequest();

  }, []);

  /* actions */
  const onExplorerButtonPress = ({ endpoint }) => {
    Linking.openURL(`https://mempool.space/${endpoint}`);
  }

  const onProfileButtonPress = async (address) => {
    navigation.push('Profile', { address: address })
  }

  /* ui */
  const drawAddress = () => {
    return (
      <View className='w-full items-start mt-4'>
        <Text adjustsFontSizeToFit={false} className='font-gilroy-bold text-black text-sm'>{transaction.type == 'RECEIVED' ? localize('WalletTransactions.ReceivedFromText') : localize('WalletTransactions.SentToText')}</Text>
        {addressFound
          ?
            <Button className='w-full mt-1' onPress={() => onProfileButtonPress(addressFound)}><Text adjustsFontSizeToFit={false} numberOfLines={2} selectable={true} className='font-gilroy text-dark-gray text-sm underline'>{addressFound}</Text></Button>
          :
            <ActivityIndicator className='mt-1' color='#303030' />
        }
      </View>
    )
  }

  return (
    <View className='w-full border-b border-b-light-gray pb-4'>
      {transaction.type == 'SENT' ? <View className='w-full mt-4'>
        <Text adjustsFontSizeToFit={false} className='font-gilroy-bold text-black text-sm'>{localize('WalletTransactions.TotalAmountText')}</Text>
        <Text adjustsFontSizeToFit={false} numberOfLines={2} className='font-gilroy text-dark-gray text-sm mt-1'>{numberFormat(transaction.value + transaction.fee)} SATs</Text>
      </View> : null}
      <View className='w-full mt-4'>
        <Text adjustsFontSizeToFit={false} className='font-gilroy-bold text-black text-sm'>{localize('WalletTransactions.TxHashText')}</Text>
        <Button onPress={() => onExplorerButtonPress({ endpoint: `tx/${transaction.txid}` })}><Text adjustsFontSizeToFit={false} numberOfLines={2} selectable={true} className='font-gilroy text-dark-gray text-sm mt-1 underline'>{transaction.txid}</Text></Button>
      </View>
      {transaction.type == 'SENT' && transaction.value == 0 ? null : drawAddress()}
      <View className='w-full flex-row'>
        {transaction.height ? <View className='flex-1 mt-4'>
          <Text adjustsFontSizeToFit={false} className='font-gilroy-bold text-black text-sm'>{localize('WalletTransactions.BlockHeightText')}</Text>
          <Text adjustsFontSizeToFit={false} numberOfLines={2} className='font-gilroy text-dark-gray text-sm mt-1'>{numberFormat(transaction.height)}</Text>
        </View> : null}
        {transaction.confirmations ? <View className='flex-1 mt-4'>
          <Text adjustsFontSizeToFit={false} className='font-gilroy-bold text-black text-sm'>{localize('WalletTransactions.ConfirmationsText')}</Text>
          <Text adjustsFontSizeToFit={false} numberOfLines={2} className='font-gilroy text-dark-gray text-sm mt-1'>{transaction.confirmations > 0 ? numberFormat(transaction.confirmations) : localize('WalletTransactions.UnconfirmedText')}</Text>
        </View> : null}
      </View>
    </View>
  )

}

export default function WalletTransaction({ transaction }) {

  /* navigation */
  let navigation = useNavigation();

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { address, inscriptions } = useWallet();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [showDetails, setShowDetais] = useState(false);

  /* actions */
  const onInscriptionButtonPress = async (inscription) => {
    let inscriptionFound = inscriptions.find((i) => i.id == inscription.id);
    if( !inscriptionFound ) {
      showModal('LOADER');
      inscriptionFound = await ordinalsApi.inscription.get({ id: inscription.id });
      hideModal('LOADER');
    }
    if( inscriptionFound ) {
      navigation.push('Inscription', { inscription: inscriptionFound });
    } else {
      Alert.alert('Hordes', localize('Error.InscriptionFetchError'));
    }
  }

  /* ui */
  if( transaction.inscriptions?.length > 0 ) {
    return transaction.inscriptions.map((inscription, index) => {
      return (
        <Button key={inscription.id} className='w-full flex-row items-center mt-4' onPress={() => onInscriptionButtonPress(inscription)}>
          <View className='w-20 h-20 items-center justify-center rounded-lg overflow-hidden'>
            <InscriptionPreview key={`wallet-transaction-${inscription.id}`} inscriptionId={inscription.id} type={inscription.content_type} textSize='text-xs' />
          </View>
          <View className='flex-1 ml-4'>
            <Text className='font-gilroy text-dark-gray text-sm'>{localize('WalletTransactions.InscriptionText')}</Text>
            <Text className='text-black font-gilroy-bold text-base'>{inscriptions.find((i) => i.id == inscription.id) ? localize('WalletTransactions.ReceivedText') : localize('WalletTransactions.SentText')}</Text>
          </View>
          <View className='flex-1 items-end ml-4'>
            <Text className='font-gilroy text-dark-gray text-xs'>{moment(transaction.timestamp * 1000).format('LL')}</Text>
            <Text className='font-gilroy text-dark-gray text-xs'>{moment(transaction.timestamp * 1000).format('LT')}</Text>
          </View>
        </Button>
      )
    });
  }
  return (
    <Fragment>
      <Button className='w-full flex-row items-center mt-4' onPress={() => setShowDetais(!showDetails)}>
        <View className='w-20 h-20 items-center justify-center border border-light-gray rounded-lg'>
          <View className='w-10 h-10'>
            <BitcoinLogo />
          </View>
          {transaction.type == 'SENT' && transaction.value == 0 ? <View className='absolute bottom-1 right-1 w-4 h-4'><SwapLogo /></View>: null}
        </View>
        {transaction.type == 'SENT' && transaction.value == 0
          ?
            <View className='flex-1 ml-4'>
              <Text className='font-gilroy-bold text-black text-base'>{localize('WalletTransactions.SwapTitleText')}</Text>
              <View className='w-full'>
                <Text className='font-gilroy text-dark-gray text-xs'>{localize('WalletTransactions.SwapDescText')}</Text>
              </View>
            </View>
          :
            <View className='flex-1 ml-4'>
              <Text className='font-gilroy text-dark-gray text-sm'>{localize('WalletTransactions.YouText')} <Text className='text-black font-gilroy-bold'>{transaction.type == 'SENT' ? localize('WalletTransactions.SentText') : localize('WalletTransactions.ReceivedText')}</Text></Text>
              <View className='flex-row items-center'>
                <Text className='font-gilroy-bold text-black text-base'>{transaction.type == 'SENT' ? '-' : '+'}{numberFormat(transaction.value)} SATs</Text>
                <View className='w-3 h-3 ml-2'>{transaction.type == 'SENT' ? <SentLogo /> : <ReceivedLogo />}</View>
              </View>
              {transaction.confirmed == false ? <Text className='font-gilroy text-dark-gray text-xs mt-1'>({localize('WalletTransactions.UnconfirmedText')})</Text> : null}
            </View>
        }
        <View className='flex-1 items-end ml-4'>
          <Text className='font-gilroy text-dark-gray text-xs'>{moment(transaction.timestamp * 1000).format('LL')}</Text>
          <Text className='font-gilroy text-dark-gray text-xs'>{moment(transaction.timestamp * 1000).format('LT')}</Text>
          {transaction.type == 'SENT' ? <Text className='font-gilroy-bold text-black text-xs mt-1 italic'>Fee {numberFormat(transaction.fee)} sats</Text> : null}
        </View>
      </Button>
      <Collapsible className='w-full' collapsed={showDetails == false}>
        <TransactionDetailView transaction={transaction} />
      </Collapsible>
    </Fragment>
  );

}
