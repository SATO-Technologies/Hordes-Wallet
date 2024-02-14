/* modules */
import { Fragment, useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, ActivityIndicator, Keyboard as KeyboardRN, Platform, Animated, Dimensions, Linking } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Collapsible from 'react-native-collapsible';
import { validate as validBitcoinAddress } from 'bitcoin-address-validation';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import Keyboard from 'components/Keyboard';
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
import BitcoinLogo from 'assets/svgs/btc.svg';
import ArrowLogo from 'assets/svgs/arrow.svg';

export default function WalletSend({ name, onClose, data = { type: 'bitcoinAddress', address: '', amount: '0', message: '' }, utxos = [] }) {

  /* localization */
  const { localize } = useLocalization();

  /* refs */
  const keyboardPadding = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  /* account context */
  const { account: { currencies: { fiat } } } = useAccount();

  /* wallet context */
  const { wallet, address, balance, createPsbtToSendBitcoin, signAndBroadcastPsbt } = useWallet();

  /* currencies context */
  const { btcPrice, currencies } = useCurrencies();

  /* mempool context */
  const { satsPerVbyte, fetchRecommendedFees } = useMempool();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [useMax, setUseMax] = useState(false);

  const [payRequest, setPayRequest] = useState({ ...data, satsPerVbyte: satsPerVbyte['halfHourFee'] });
  const [feeRateSelected, setFreeRateSelected] = useState('halfHourFee');
  const [txSize, setTxSize] = useState(0);
  const [inputs, setInputs] = useState([]);
  const [showInputs, setShowInputs] = useState(false);
  const [outputs, setOutputs] = useState([]);
  const [showOutputs, setShowOutputs] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showBalaceInSats, setShowBalanceInSats] = useState(false);

  /* effects */
  useEffect(() => {

    setShow(true);

    const doAsyncRequest = async () => {
      await fetchRecommendedFees();
      let estimatedTxSize = await createPsbtToSendBitcoin({ destinationAddress: address.payments, amount: 546, utxos: utxos, extractTxSizeOnly: true });
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

  useEffect(() => {
    if( useMax == true ) {
      setShowKeyboard(false);
      let amount = balance - (txSize * satsPerVbyte[feeRateSelected]);
      if( amount > 0 ) {
        setPayRequest({ ...payRequest, amount: `${amount}` });
      } else {
        showModal('RESPONSE', {
          type: 'ERROR',
          message: localize('Error.InsufficientFundsText')
        });
      }
    }
  }, [useMax, feeRateSelected]);

  useEffect(() => {

    const doAsyncRequest = async () => {
      let address = payRequest.address;
      let amount = +payRequest.amount;
      if( validBitcoinAddress(address) && amount > 0 ) {
        let inputsAndOutputs = await createPsbtToSendBitcoin({ destinationAddress: address, amount: amount, satsPerVbyte: payRequest.satsPerVbyte, utxos: utxos, extractInputsAndOutputsOnly: true });
        if( inputsAndOutputs && inputsAndOutputs.inputs && inputsAndOutputs.outputs ) {
          setInputs(inputsAndOutputs.inputs);
          setOutputs(inputsAndOutputs.outputs);
        }
      } else {
        setInputs([]);
        setOutputs([]);
      }
    }
    doAsyncRequest();

  }, [payRequest, feeRateSelected]);

  /* hooks */
  useBackHandler(() => {
    onCloseModalButtonPress(null);
    return true;
  });

  /* actions */
  const onCloseModalButtonPress = () => {
    setShow(false);
    setTimeout(async () => {
      hideModal(name);
    }, 250);
  }

  /* actions */
  const onScanQRButtonPress = () => {
    showModal('QR_SCANNER', {
      onData: async (request) => {
        switch (request.type) {
          case 'bitcoinAddress':
            setPayRequest({ ...payRequest, ...request });
            break;
        }
      }
    })
  }

  const onSendButtonPress = () => {
    scrollRef.current?.scrollTo({ x: Dimensions.get('window').width, animated: true });
    setShowBack(true);
  }

  const onEditFeeButtonPress = () => {
    scrollRef.current?.scrollTo({ x: 0, animated: true });
    setShowBack(false);
  }

  const onConfirmButtonPress = async () => {
    setProcessing(true);

    let sendBitcoinPsbt = await createPsbtToSendBitcoin({ destinationAddress: payRequest.address, amount: +payRequest.amount, satsPerVbyte: payRequest.satsPerVbyte, utxos: utxos });
    if( sendBitcoinPsbt == null ) {
      showModal('RESPONSE', {
        type: 'ERROR',
        message: localize('Error.CreateSendBitcoinPsbtText')
      });
      setProcessing(false);
      return;
    }
    if( sendBitcoinPsbt == 'INSUFFICIENT_FUNDS' ) {
      showModal('RESPONSE', {
        type: 'ERROR',
        message: localize('Error.InsufficientFundsText')
      });
      setProcessing(false);
    } else {
      let sendBitcoinTransaction = await signAndBroadcastPsbt({ base64Psbt: sendBitcoinPsbt.toBase64() });
      if( sendBitcoinTransaction && sendBitcoinTransaction.txid ) {
        showModal('RESPONSE', {
          type: 'SUCCESS',
          message: localize('WalletSend.SuccessText', [numberFormat(satsToBtc(+payRequest.amount)), payRequest.address])
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
  const drawStep1 = () => {
    let totalPay = utxos.length == 0 ? (+payRequest.amount) : 0;
    let validForSend = validBitcoinAddress(payRequest.address) && +payRequest.amount > 0 && balance >= (totalPay + (txSize * satsPerVbyte[feeRateSelected]))
    let totalFee = txSize * payRequest.satsPerVbyte;
    return (
      <ScrollView className='w-screen h-full px-4' showsVerticalScrollIndicator={false}>
        <View className='w-full pb-4'>
          <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletSend.AddressText')}</Text>
          <View className='w-full justify-center rounded-lg mt-2'>
            <View className='w-full flex-row items-center border border-light-gray rounded-lg'>
              <View className='flex-1 h-12 bg-white rounded-lg pl-4'>
                <TextInput className={`w-full h-full ${emptyString(payRequest.address) ? 'font-gilroy' : 'font-gilroy-bold text-black'}`} value={payRequest.address} onChangeText={(value) => setPayRequest({ ...payRequest, address: value })} placeholder={localize('WalletSend.WriteHereText')} placeholderTextColor='#68717b' />
              </View>
              <Button className='h-12 items-center justify-center bg-white rounded-lg px-4 ml-4' onPress={onScanQRButtonPress}>
                <View className='w-5'><ScanLogo /></View>
              </Button>
            </View>
          </View>
          <Text className='font-gilroy text-dark-gray text-lg mt-4'>{localize('WalletSend.AmountText')}</Text>
          <View className='w-full px-4 border border-light-gray rounded-lg mt-2'>
            <View className='w-full h-20 flex-row items-center justify-center'>
              <View className='flex-1'>
                <Text className={`${emptyString(payRequest.amount) ? 'font-gilroy text-dark-gray text-base' : 'font-gilroy-bold text-black text-2xl'}`}>{emptyString(payRequest.amount) ? localize('WalletSend.WriteHereText') : `${numberFormat(payRequest.amount)} sats`}</Text>
                <Text className='font-gilroy text-dark-gray text-sm'>{!emptyString(payRequest.amount) ? `${numberFormat(satsToBtc(payRequest.amount))} BTC` : ''}</Text>
              </View>
              {utxos.length == 0
                ?
                  <Fragment>
                    <Button className={`px-4 py-2 rounded-full ${useMax ? 'bg-black' : 'bg-light-gray'}`} onPress={() => setUseMax(!useMax)}>
                      <Text className={`font-gilroy ${useMax ? 'text-white' : 'text-black'} text-xs`}>{localize('WalletSend.MaxText')}</Text>
                    </Button>
                    {useMax == false ? <Button className='w-8 h-10 items-end justify-center' onPress={() => setShowKeyboard(!showKeyboard)}>
                      <View className='w-5 h-5'><BackLogo style={{ transform: [{ rotate: showKeyboard == true ? '90deg' : '-90deg' }] }} /></View>
                    </Button> : null}
                  </Fragment>
                :
                  null
              }
            </View>
            {utxos.length == 0 ? <Collapsible className='w-full' collapsed={showKeyboard == false}>
              <View className='w-full pb-4'>
                <Keyboard onPress={(value) => value == '<' ? setPayRequest({ ...payRequest, amount: payRequest.amount.slice(0, -1) }) : setPayRequest({ ...payRequest, amount: `${payRequest.amount}${value}` })}  />
              </View>
            </Collapsible> : null}
          </View>
          <Button className='flex-row items-center mt-2' onPress={() => setShowBalanceInSats(!showBalaceInSats)}>
            <Text className='font-gilroy text-dark-gray text-sm'>{localize('WalletSend.MyBalanceText')}</Text>
            <Text className='font-gilroy-bold text-black text-sm ml-2'>{numberFormat(showBalaceInSats ? balance : satsToBtc(balance))} {showBalaceInSats ? 'sats' : 'BTC'}</Text>
          </Button>
          <View className='w-full mt-4'>
            <FeeRate title={localize('WalletSend.TransactionSpeedText')} value={feeRateSelected} onSelect={(feeRate) => { setFreeRateSelected(feeRate); setPayRequest({ ...payRequest, satsPerVbyte: satsPerVbyte[feeRate] }); }} />
          </View>
          <View className='w-full flex-row items-center justify-between mt-4'>
            <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletSend.NetworkFeeText')}</Text>
          </View>
          <View className='w-full px-4 py-2 border border-light-gray rounded-lg mt-2'>
            <Text className='font-gilroy-bold text-black text-lg'>{numberFormat(totalFee)} sats</Text>
            <Text className='font-gilroy text-dark-gray text-xs'>≈ {`${numberFormat(satsToBtc(totalFee) * btcPrice * currencies[fiat], 3)} ${fiat}`}</Text>
          </View>
          <Button className={`w-full h-12 items-center justify-center ${validForSend ? 'bg-black' : 'bg-gray'} rounded-lg mt-8`} onPress={validForSend ? onSendButtonPress : null}>
            <Text className='font-gilroy-bold text-white uppercase tracking-widest text-xs'>{localize('WalletSend.SendText')}</Text>
          </Button>
        </View>
      </ScrollView>
    )
  }

  const drawStep2 = () => {
    let totalFee = txSize * payRequest.satsPerVbyte;
    return (
      <ScrollView className='w-screen h-full px-4' showsVerticalScrollIndicator={false}>
        <View className='w-full justify-center pb-4'>
          <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletSend.AddressText')}</Text>
          <View className='w-full px-4 py-3 border border-light-gray rounded-lg mt-2'>
            <Text className='font-gilroy-bold text-black'>{payRequest.address}</Text>
          </View>
          <Text className='font-gilroy text-dark-gray text-lg mt-4'>{localize('WalletSend.AmountText')}</Text>
          <View className='w-full px-4 py-2 border border-light-gray rounded-lg mt-2'>
            <Text className='font-gilroy-bold text-black text-2xl'>{`${numberFormat(payRequest.amount)} sats`}</Text>
            <Text className='font-gilroy text-dark-gray text-xs'>≈ {`${numberFormat(satsToBtc(+payRequest.amount) * btcPrice * currencies[fiat], 3)} ${fiat}`}</Text>
          </View>
          <View className='w-full flex-row items-center justify-between mt-4'>
            <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletSend.NetworkFeeText')}</Text>
            <Button className='px-4 py-2' onPress={onEditFeeButtonPress}><Text className='font-gilroy text-black underline'>{localize('WalletSend.EditFeeText')}</Text></Button>
          </View>
          <View className='w-full px-4 py-2 border border-light-gray rounded-lg mt-2'>
            <Text className='font-gilroy-bold text-black text-lg'>{numberFormat(totalFee)} sats</Text>
            <Text className='font-gilroy text-dark-gray text-xs'>≈ {`${numberFormat(satsToBtc(totalFee) * btcPrice * currencies[fiat], 3)} ${fiat}`}</Text>
          </View>
          {inputs.length > 0
            ?
              <Fragment>
                <View className='w-full flex-row items-center mt-4'>
                  <View className='flex-1'>
                    <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletSend.InputsText')} ({inputs.length})</Text>
                  </View>
                  <Button className='w-8 h-8 items-end justify-center' onPress={() => setShowInputs(!showInputs)}>
                    <View className='w-4 h-4'><ArrowLogo style={{ transform: [{ rotate: showInputs ? '90deg' : '-90deg' }] }} /></View>
                  </Button>
                </View>
                <Collapsible className='w-full' collapsed={showInputs == false}>
                  <View className='w-full border border-light-gray rounded-lg mt-2'>
                    {inputs.map((input, index) => {
                      return (
                        <View key={index} className='w-full px-4 py-2 border-b border-b-light-gray'>
                          <View className='w-full flex-row'>
                            <View className='flex-[0.7]'>
                              <Text className='font-gilroy-bold text-black text-sm'>Utxo</Text>
                              <Button onPress={() => Linking.openURL(`https://mempool.space/tx/${input.txid}`)}><Text className='font-gilroy text-dark-gray text-xs underline'>{input.txid}:{input.vout}</Text></Button>
                            </View>
                            <View className='flex-[0.3] items-end'>
                              <Text className='font-gilroy-bold text-black text-sm'>Value</Text>
                              <Text className='font-gilroy text-dark-gray text-sm'>{numberFormat(input.value)} sats</Text>
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                </Collapsible>
              </Fragment>
            :
              null
          }
          {outputs.length > 0
            ?
              <Fragment>
                <View className='w-full flex-row items-center mt-4'>
                  <View className='flex-1'>
                    <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletSend.OutputsText')} ({outputs.length})</Text>
                  </View>
                  <Button className='w-8 h-8 items-end justify-center' onPress={() => setShowOutputs(!showOutputs)}>
                    <View className='w-4 h-4'><ArrowLogo style={{ transform: [{ rotate: showOutputs ? '90deg' : '-90deg' }] }} /></View>
                  </Button>
                </View>
                <Collapsible className='w-full' collapsed={showOutputs == false}>
                  <View className='w-full border border-light-gray rounded-lg mt-2'>
                    {outputs.map((output, index) => {
                      return (
                        <View key={index} className='w-full px-4 py-2 border-b border-b-light-gray'>
                          <View className='w-full flex-row'>
                            <View className='flex-[0.7]'>
                              <Text className='font-gilroy-bold text-black text-sm'>Address</Text>
                              <Text className='font-gilroy text-dark-gray text-xs'>{output.address}</Text>
                            </View>
                            <View className='flex-[0.3] items-end'>
                              <Text className='font-gilroy-bold text-black text-sm'>Value</Text>
                              <Text className='font-gilroy text-dark-gray text-sm'>{numberFormat(output.value)} sats</Text>
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                </Collapsible>
              </Fragment>
            :
              null
          }
          <Text className='font-gilroy text-dark-gray text-lg mt-4'>{localize('WalletSend.NetworkText')}</Text>
          <View className='w-full px-4 border border-light-gray rounded-lg mt-2'>
            <View className='w-full h-12 justify-center'>
              <Text className='font-gilroy text-black'>Mainnet</Text>
            </View>
          </View>
          {processing
            ?
              <View className='w-full items-center mt-4'><ActivityIndicator size='large' /></View>
            :
              <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-4' onPress={onConfirmButtonPress}>
                <Text className='font-gilroy-bold text-white uppercase tracking-widest text-xs'>{localize('WalletSend.ConfirmText')}</Text>
              </Button>
          }
        </View>
      </ScrollView>
    )
  }

  return (
    <Modal show={show}>
      <Animated.View className='w-full flex-1' style={{ marginBottom: Platform.OS === 'ios' ? keyboardPadding : 0 }}>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={5} reducedTransparencyFallbackColor='white' />
        <CustomSafeAreaView cn='w-full flex-1'>
          <View className='w-full flex-1 justify-end'>
            <View className='w-full h-[98%] items-center bg-white rounded-t-xl'>
              <View className='w-full h-20 items-center justify-center'>
                {showBack ? <Button className='absolute left-4 bg-light-gray rounded-full p-3' onPress={onEditFeeButtonPress}><BackLogo width={15} height={15} /></Button> : null}
                <Text className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{showBack ? localize('WalletSend.HeaderText2') : localize('WalletSend.HeaderText1')}</Text>
                <Button className='absolute right-4 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
              </View>
              <View className='w-full flex-1'>
                <ScrollView ref={scrollRef} className='w-full h-full' horizontal={true} pagingEnabled={true} scrollEnabled={false} showsHorizontalScrollIndicator={false}>
                  {drawStep1()}
                  {drawStep2()}
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
