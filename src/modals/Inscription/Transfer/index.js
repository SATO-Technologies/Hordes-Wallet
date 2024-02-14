/* modules */
import { Fragment, useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, ActivityIndicator, Keyboard as KeyboardRN, Platform, Animated, Dimensions } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Collapsible from 'react-native-collapsible';
import { validate as validBitcoinAddress } from 'bitcoin-address-validation';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import InscriptionPreview from 'components/Inscription/Preview';
import FeeRate from 'components/Wallet/FeeRate';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useCurrencies } from 'contexts/currencies';
import { useMempool } from 'contexts/mempool';
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* utils */
import { emptyString, ellipsis } from 'utils/string';
import { numberFormat } from 'utils/number';
import { satsToBtc } from 'utils/blockchain';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';
import BackLogo from 'assets/svgs/arrow.svg';
import ScanLogo from 'assets/svgs/scan.svg';

export default function InscriptionTransfer({ name, onClose, inscription }) {

  /* localization */
  const { localize } = useLocalization();

  /* refs */
  const keyboardPadding = useRef(new Animated.Value(0)).current;

  /* account context */
  const { account: { currencies: { fiat } } } = useAccount();

  /* wallet context */
  const { wallet, address, balance, createPsbtToTransferInscription, signAndBroadcastPsbt } = useWallet();

  /* currencies context */
  const { btcPrice, currencies } = useCurrencies();

  /* mempool context */
  const { satsPerVbyte, fetchRecommendedFees } = useMempool();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);

  const [transferRequest, setTransferRequest] = useState({
    type: 'bitcoinAddress',
    address: '',
    amount: '',
    satsPerVbyte: satsPerVbyte['halfHourFee']
  });
  const [feeRateSelected, setFreeRateSelected] = useState('halfHourFee');
  const [txSize, setTxSize] = useState(0);
  const [processing, setProcessing] = useState(false);

  /* effects */
  useEffect(() => {

    setShow(true);

    const doAsyncRequest = async () => {
      await fetchRecommendedFees();
      let estimatedTxSize = await createPsbtToTransferInscription({ inscription: inscription, destinationAddress: address.payments, amount: 546, extractTxSizeOnly: true });
      if( estimatedTxSize > 0 ) setTxSize(estimatedTxSize);
    }
    doAsyncRequest();

    const keyboardWillShowListener = KeyboardRN.addListener('keyboardWillShow', (event) => {
      if( Platform.OS === 'android' ) return;
      Animated.timing(keyboardPadding, {
        duration: event.duration,
        toValue: event.endCoordinates.height,
        useNativeDriver: false
      }).start();
    });
    const keyboardWillHideListener = KeyboardRN.addListener('keyboardWillHide', (event) => {
      if( Platform.OS === 'android' ) return;
      Animated.timing(keyboardPadding, {
        duration: event.duration,
        toValue: 0,
        useNativeDriver: false
      }).start();
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };

  }, []);

  /* hooks */
  useBackHandler(() => {
    onCloseModalButtonPress(null);
    return true;
  });

  /* actions */
  const onCloseModalButtonPress = () => {
    setShow(false);
    setTimeout(async () => {
      if( onClose ) onClose();
      hideModal(name);
    }, 250);
  }

  /* actions */
  const onScanQRButtonPress = () => {
    showModal('QR_SCANNER', {
      onData: async (request) => {
        switch (request.type) {
          case 'bitcoinAddress':
            setTransferRequest({ ...transferRequest, ...request });
            break;
        }
      }
    })
  }

  const onTransferButtonPress = async () => {
    setProcessing(true);

    let transferInscriptionPsbt = await createPsbtToTransferInscription({ inscription: inscription, destinationAddress: transferRequest.address, satsPerVbyte: transferRequest.satsPerVbyte });
    if( transferInscriptionPsbt == null ) {
      showModal('RESPONSE', {
        type: 'ERROR',
        message: localize('Error.CreateTransferInscriptionPsbtText')
      });
      setProcessing(false);
      return;
    }
    if( transferInscriptionPsbt == 'INSUFFICIENT_FUNDS' ) {
      showModal('RESPONSE', {
        type: 'ERROR',
        message: localize('Error.InsufficientFundsText')
      });
      setProcessing(false);
    } else {
      let transferInscriptionTransaction = await signAndBroadcastPsbt({ base64Psbt: transferInscriptionPsbt.toBase64() });
      if( transferInscriptionTransaction && transferInscriptionTransaction.txid ) {
        showModal('RESPONSE', {
          type: 'SUCCESS',
          message: localize('InscriptionTransfer.SuccessText', [inscription.id, transferRequest.address])
        });
        setProcessing(false);
        if( onClose ) onClose();
        onCloseModalButtonPress();
      } else {
        setProcessing(false);
        showModal('RESPONSE', {
          type: 'ERROR',
          message: localize('Error.BroadcastTxText')
        });
      }
    }
  }

  /* ui */
  let validForTransfer = validBitcoinAddress(transferRequest.address);
  let totalFee = txSize * transferRequest.satsPerVbyte;
  return (
    <Modal show={show}>
      <Animated.View className='w-full flex-1' style={{ marginBottom: Platform.OS === 'ios' ? keyboardPadding : 0 }}>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={5} reducedTransparencyFallbackColor='white' />
        <CustomSafeAreaView cn='w-full flex-1'>
          <View className='w-full flex-1 justify-end'>
            <View className='w-full h-[98%] items-center bg-white rounded-t-xl'>
              <View className='w-full h-20 items-center justify-center'>
                <Text className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('InscriptionTransfer.HeaderText')}</Text>
                <Button className='absolute right-4 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
              </View>
              <View className='w-full flex-1'>
                <ScrollView className='w-screen h-full px-4' showsVerticalScrollIndicator={false}>
                  <View className='w-full flex-row items-start justify-start'>
                    <View className='w-40 h-40 rounded-lg overflow-hidden'><InscriptionPreview key={`inscription-transfer-${inscription.id}`} inscriptionId={inscription.id} type={inscription.content_type} /></View>
                    <View className='w-4' />
                    <View className='flex-1 items-start justify-center border border-light-gray rounded-lg px-4 py-2'>
                      <Text className='font-gilroy-bold text-black text-base'>{inscription.meta?.name || `${localize('Inscription.TitleText', [numberFormat(inscription.num)])}`}</Text>
                      {inscription.meta?.name ? <Text className='font-gilroy text-black text-xs'>{localize('Inscription.TitleText', [numberFormat(inscription.num)])}</Text> : null}
                      <Text className='font-gilroy text-black text-xs mt-2'>{ellipsis(inscription.owner, 8)}</Text>
                    </View>
                  </View>
                  <Text className='font-gilroy text-dark-gray text-lg mt-8'>{localize('InscriptionTransfer.AddressText')}</Text>
                  <View className='w-full flex-row items-center border border-light-gray rounded-lg mt-2'>
                    <View className='flex-1 h-12 bg-white rounded-lg pl-4'>
                      <TextInput className='w-full h-full font-gilroy' value={transferRequest.address} onChangeText={(value) => setTransferRequest({ ...transferRequest, address: value })} placeholder={localize('InscriptionTransfer.WriteHereText')} placeholderTextColor='#68717b' />
                    </View>
                    <Button className='h-12 items-center justify-center bg-white rounded-lg px-4 ml-4' onPress={onScanQRButtonPress}>
                      <View className='w-5'><ScanLogo /></View>
                    </Button>
                  </View>
                  <View className='w-full mt-4'>
                    <FeeRate title={localize('WalletSend.TransactionSpeedText')} value={feeRateSelected} onSelect={(feeRate) => { setFreeRateSelected(feeRate); setTransferRequest({ ...transferRequest, satsPerVbyte: satsPerVbyte[feeRate] }); }} />
                  </View>
                  <Text className='font-gilroy text-dark-gray text-lg mt-4'>{localize('WalletSend.NetworkFeeText')}</Text>
                  <View className='w-full px-4 py-2 border border-light-gray rounded-lg mt-2'>
                    <Text className='font-gilroy-bold text-black text-lg'>{numberFormat(totalFee)} sats</Text>
                    <Text className='font-gilroy text-dark-gray text-xs'>≈ {`${numberFormat(satsToBtc(totalFee) * btcPrice * currencies[fiat], 3)} ${fiat}`}</Text>
                  </View>
                  {processing
                    ?
                      <View className='w-full items-center mt-4'><ActivityIndicator size='large' /></View>
                    :
                      <Button className={`w-full h-12 items-center justify-center ${validForTransfer ? 'bg-black' : 'bg-gray'} rounded-lg mt-8`} onPress={validForTransfer ? onTransferButtonPress : null}>
                        <Text className='font-gilroy-bold text-white uppercase tracking-widest text-xs'>{localize('InscriptionTransfer.TransferText')}</Text>
                      </Button>
                  }
                </ScrollView>
              </View>
            </View>
          </View>
        </CustomSafeAreaView>
        <SafeAreaView className='flex-0 bg-white' />
      </Animated.View>
    </Modal>
  );

}
