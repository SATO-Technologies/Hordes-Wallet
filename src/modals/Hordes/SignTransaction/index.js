/* modules */
import { Fragment, useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import Collapsible from 'react-native-collapsible';

/* crypto modules */
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { bip32, ECPair } from 'managers/ecc.tsx';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371.js';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useCurrencies } from 'contexts/currencies';
import { useModals } from 'contexts/modals';

/* managers */
import hordesApi from 'managers/hordes';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* utils */
import { emptyString, ellipsis } from 'utils/string';
import { numberFormat } from 'utils/number';
import { satsToBtc } from 'utils/blockchain';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';
import BackLogo from 'assets/svgs/arrow.svg';
import HordesLogo from 'assets/svgs/hordesShare.svg';
import ArrowLogo from 'assets/svgs/arrow.svg';

function PsbtToSign({ psbt }) {

  /* states */
  const [showInputsToSign, setShowInputsToSign] = useState(true);

  /* ui */
  return (
    <View className='w-full bg-light-gray border border-light-gray rounded-lg overflow-hidden mt-4'>
      <View className='w-full flex-row items-center px-4'>
        <View className='flex-1'>
          <Text className='font-gilroy-bold text-dark-gray text-base'>Inputs</Text>
        </View>
        <Button className='w-12 h-12 items-end justify-center' onPress={() => setShowInputsToSign(!showInputsToSign)}>
          <View className='w-5 h-5'><ArrowLogo style={{ transform: [{ rotate: showInputsToSign ? '90deg' : '-90deg' }] }} /></View>
        </Button>
      </View>
      <Collapsible className='w-full' collapsed={showInputsToSign == false}>
        <View className='w-full bg-white px-4 pb-4'>
          {psbt.inputsToSign.map((input, index) => {
            return (
              <View key={index} className='w-full mt-4'>
                <Text className='font-gilroy-bold text-black text-base'>Address</Text>
                <Text className='font-gilroy text-black text-sm'>{input.address}</Text>
                <View className='w-full flex-row mt-4'>
                  <View className='flex-1'>
                    <Text className='font-gilroy-bold text-black text-base'>Signing Indexes</Text>
                    <Text className='font-gilroy text-black text-sm'>{input.signingIndexes.join(', ')}</Text>
                  </View>
                  {input.sigHash == null ? null : <View className='flex-1'>
                    <Text className='font-gilroy-bold text-black text-base'>Sig Hash</Text>
                    <Text className='font-gilroy text-black text-sm'>{input.sigHash}</Text>
                  </View>}
                </View>
              </View>
            )
          })}
        </View>
      </Collapsible>
    </View>
  )

}

export default function HordesSignTransaction({ name, onClose, data = { }, onData = null }) {

  /* refs */
  const socketRef = useRef(null);

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { account: { currencies: { fiat } } } = useAccount();

  /* wallet context */
  const { wallet, sync, buildDerivationPath, signPsbt, signAndBroadcastPsbt } = useWallet();

  /* currencies context */
  const { btcPrice, currencies } = useCurrencies();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);
  const [requests, setRequests] = useState(null);
  const [showInputsToSign, setShowInputsToSign] = useState(true);
  const [processing, setProcessing] = useState(false);

  /* effects */
  useEffect(() => {

    setShow(true);

    const fillRequests = (decodedTokens) => {
      setRequests(decodedTokens.map((decodedToken) => {
        return {
          base64Psbt: decodedToken.psbtBase64,
          broadcast: decodedToken.broadcast,
          inputsToSign: decodedToken.inputsToSign
        }
      }));
    }

    if( onData ) {
      fillRequests([jwtDecode(data)]);
    } else {
      connectSocket();
      async function doAsyncRequest() {
        let request = await hordesApi.connect.request({
          id: data.requestId
        });
        if( request && request.token ) {
          fillRequests([jwtDecode(request.token)]);
        } else if( request && request.tokens ) {
          let decodedTokens = [];
          for( const token of request.tokens ) {
            decodedTokens.push(jwtDecode(token))
          }
          fillRequests(decodedTokens);
        } else {
          Alert.alert('Hordes', 'Unknown type');
          onCloseModalButtonPress();
        }
      }
      doAsyncRequest();
    }

  }, []);

  /* hooks */
  useBackHandler(() => {
    onCloseModalButtonPress(null);
    return true;
  });

  /* actions */
  const connectSocket = (callback) => {
    socketRef.current?.disconnect();
    socketRef.current = io.connect('https://ws.bysato.com');
    socketRef.current.on('connect', async () => {
      setConnectionTime((new Date()).getTime());
      if( callback ) callback();
    });
  }

  const signPsbts = (psbtsToSign, ordinalsSigner, fundsSigner) => {
    let signedPsbts = [];

    let oa = bitcoin.payments.p2tr({ internalPubkey: toXOnly(ordinalsSigner.publicKey), network: bitcoin.networks.bitcoin }).address;
    let fa = bitcoin.payments.p2tr({ internalPubkey: toXOnly(fundsSigner.publicKey), network: bitcoin.networks.bitcoin }).address;

    let signers = {
      [oa]: ordinalsSigner,
      [fa]: fundsSigner
    };
    let tweakedSigners = {
      [oa]: ordinalsSigner.tweak(bitcoin.crypto.taggedHash('TapTweak', toXOnly(ordinalsSigner.publicKey))),
      [fa]: fundsSigner.tweak(bitcoin.crypto.taggedHash('TapTweak', toXOnly(fundsSigner.publicKey)))
    };

    for( const psbtToSign of psbtsToSign ) {
      let psbt = bitcoin.Psbt.fromBase64(psbtToSign.base64Psbt);

      for( const inputToSign of psbtToSign.inputsToSign ) {
        for( const signIndex of inputToSign.signingIndexes ) {
          let input = psbt.data.inputs[signIndex];
          if( input ) {
            let a = bitcoin.address.fromOutputScript(input.witnessUtxo.script, bitcoin.networks.bitcoin);
            if( a in tweakedSigners ) {
              if( inputToSign.sigHash ) {
                psbt.signInput(signIndex, tweakedSigners[a], [inputToSign.sigHash]);
              } else {
                psbt.signInput(signIndex, tweakedSigners[a]);
              }
            }
            if( input.tapLeafScript && input.tapInternalKey ) {
              a = bitcoin.payments.p2tr({ internalPubkey: toXOnly(input.tapInternalKey), network: bitcoin.networks.bitcoin }).address;
              if( a in signers ) {
                if( inputToSign.sigHash ) {
                  psbt.signInput(signIndex, signers[a], [inputToSign.sigHash]);
                } else {
                  psbt.signInput(signIndex, signers[a]);
                }
              }
            }
          }
        }
      }

      signedPsbts.push(psbt.toBase64());

    }

    return signedPsbts;
  }

  const onApproveButtonPress = () => {

    const approveRequest = async () => {

      setProcessing(true);

      // let base64PsbtsSigned = [];
      // for( const psbtToSign of requests ) {
      //   let signedPsbt = await signPsbt({ id: wallet.id, base64Psbt: psbtToSign.base64Psbt });
      //   if( signedPsbt ) base64PsbtsSigned.push(signedPsbt)
      // }
      // console.log('base64PsbtsSigned', base64PsbtsSigned)
      //
      // if( onData ) {
      //   onData({
      //     psbtBase64: base64PsbtsSigned.length == 1 ? base64PsbtsSigned[0] : base64PsbtsSigned
      //   });
      // } else {
      //   socketRef.current.emit('hordes_response', {
      //     channelId: data.channelId,
      //     data: {
      //       payload: {
      //         psbtBase64: base64PsbtsSigned.length == 1 ? base64PsbtsSigned[0] : base64PsbtsSigned
      //       }
      //     }
      //   });
      // }
      //
      // onCloseModalButtonPress();

      showModal('PASSCODE_AUTHENTICATOR', {
        mnemonic: wallet.mnemonic,
        onSuccess: async (mnemonic) => {

          setTimeout(async () => {

            const seed = await bip39.mnemonicToSeed(mnemonic);
            const node = bip32.fromSeed(seed);

            const ordinalsAddressWif = node.derivePath(`${buildDerivationPath(wallet.derivationPath)}`).toWIF();
            const ordinalsSigner = ECPair.fromWIF(ordinalsAddressWif);

            const paymentsAddressWif = node.derivePath(`${buildDerivationPath({ ...wallet.derivationPath, addressIndex: 1 })}`).toWIF();
            const paymentsSigner = ECPair.fromWIF(paymentsAddressWif);

            let base64PsbtsSigned = signPsbts(requests, ordinalsSigner, paymentsSigner);
            console.log('base64PsbtsSigned', base64PsbtsSigned)

            if( onData ) {
              onData(base64PsbtsSigned.length == 1 ? { psbtBase64: base64PsbtsSigned[0] } : base64PsbtsSigned);
            } else {
              socketRef.current.emit('hordes_response', {
                channelId: data.channelId,
                data: {
                  payload: base64PsbtsSigned.length == 1 ? { psbtBase64: base64PsbtsSigned[0] } : base64PsbtsSigned
                }
              });
            }

            onCloseModalButtonPress();

          }, 300);

        }
      });

    }

    if( onData ) {
      approveRequest();
    } else {
      let diff = (new Date()).getTime() - connectionTime;
      diff = parseInt(diff / 1000);
      if( diff > 300 ) {
        connectSocket(() => {
          approveRequest();
        });
      } else {
        approveRequest()
      }
    }

  }

  const onCloseModalButtonPress = () => {
    setShow(false);
    setTimeout(async () => {
      sync({ id: wallet.id });
      if( onClose ) onClose();
      hideModal(name);
    }, 250);
  }

  /* data */
  const totalCost = () => {
    let totalInputs = 0;
    let totalOutputs = 0;
    for( const psbtToSign of requests ) {
      let psbt = bitcoin.Psbt.fromBase64(psbtToSign.base64Psbt);
      for( const input of psbt.data.inputs ) {
        totalInputs += input.witnessUtxo.value;
      }
      for( const output of psbt.txOutputs ) {
        totalOutputs += output.value;
      }
    }
    return totalInputs - totalOutputs
  }

  /* ui */
  return (
    <Modal show={show}>
      <View className='w-full flex-1'>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={5} reducedTransparencyFallbackColor='white' />
        <CustomSafeAreaView cn='w-full flex-1'>
          <View className='w-full flex-1 justify-end'>
            <View className='w-full h-[97%] items-center bg-white rounded-t-xl android:pb-4'>
              <View className='w-full h-20 items-center justify-center'>
                <Text className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('HordesPlugin.SignTransactionTitleText')}</Text>
                <Button className='absolute right-4 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
              </View>
              {requests
                ?
                  <View className='w-full flex-1 px-4'>
                    <View className='w-full flex-1 justify-center'>
                      <ScrollView className='w-full flex-1' showsVerticalScrollIndicator={false}>
                        {requests.map((request, index) => {
                          return (
                            <View key={index} className={`w-full ${index > 0 ? 'mt-8' : ''}`}>
                              <Text className='font-gilroy-bold text-black text-base'>Transaction #{index+1}</Text>
                              <PsbtToSign key={index} psbt={request} />
                            </View>
                          )
                        })}
                        <View className='w-full border-t border-light-gray my-8' />
                        <View className='w-full'>
                          <Text className='font-gilroy-bold text-black text-base'>Total Cost</Text>
                          <View className='flex-row items-center justify-between '>
                            <Text className='font-gilroy text-dark-gray text-3xl'>{numberFormat(totalCost())} sats</Text>
                            <Text className='font-gilroy text-dark-gray text-base'>≈ {`${numberFormat(satsToBtc(totalCost()) * btcPrice * currencies[fiat], 3)} ${fiat}`}</Text>
                          </View>
                        </View>
                        {processing
                          ?
                            <View className='w-full h-12 items-center mt-8'>
                              <ActivityIndicator size='large' />
                            </View>
                          :
                            <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-8' onPress={onApproveButtonPress}>
                              <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('HordesPlugin.SignTransactionApproveText')}</Text>
                            </Button>
                        }
                      </ScrollView>
                    </View>
                  </View>
                :
                  <View className='w-full flex-1 justify-center'>
                    <ActivityIndicator size='large' />
                  </View>
              }
            </View>
          </View>
        </CustomSafeAreaView>
        <SafeAreaView className='flex-0 bg-white' />
      </View>
    </Modal>
  );

}
