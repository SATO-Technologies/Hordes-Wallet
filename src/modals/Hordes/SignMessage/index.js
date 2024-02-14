/* modules */
import { Fragment, useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { io } from 'socket.io-client';
import { Signer, Verifier } from 'bip322-js';
import * as bip39 from 'bip39';
import { bip32, ECPair } from 'managers/ecc.tsx';
import { jwtDecode } from 'jwt-decode';
import * as bitcoin from 'bitcoinjs-lib';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* managers */
import hordesApi from 'managers/hordes';
import bip322 from 'managers/bip322';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* utils */
import { emptyString, ellipsis } from 'utils/string';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';
import BackLogo from 'assets/svgs/arrow.svg';
import HordesLogo from 'assets/svgs/hordesShare.svg';

export default function HordesSignMessage({ name, onClose, data = { }, onData = null }) {

  /* refs */
  const socketRef = useRef(null);

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { wallet, sync, buildDerivationPath, signPsbt } = useWallet();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);
  const [request, setRequest] = useState(null);
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [processing, setProcessing] = useState(false);

  /* effects */
  useEffect(() => {

    setShow(true);

    const fillRequest = (decodedToken) => {
      setRequest({
        address: decodedToken.address,
        message: decodedToken.message
      });
    }

    if( onData ) {
      fillRequest(jwtDecode(data));
    } else {
      connectSocket();
      async function doAsyncRequest() {
        let request = await hordesApi.connect.request({
          id: data.requestId
        });
        if( request && request.token ) {
          fillRequest(jwtDecode(request.token));
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

  const onApproveButtonPress = () => {

    const approveRequest = async () => {

      setProcessing(true);

      showModal('PASSCODE_AUTHENTICATOR', {
        mnemonic: wallet.mnemonic,
        onSuccess: async (mnemonic) => {

          setTimeout(async () => {

            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const node = bip32.fromSeed(seed);
            const wif = node.derivePath(buildDerivationPath(wallet.derivationPath)).toWIF();

            const bip322PsbtBase64 = bip322.signMessage({ wif: wif, address: request.address, message: request.message });
            const bip322PsbtSigned = await signPsbt({ id: wallet.id, base64Psbt: bip322PsbtBase64 });

            const psbt = bitcoin.Psbt.fromBase64(bip322PsbtSigned);
            const witness = psbt.data.inputs[0].finalScriptWitness;
            if( witness ) {
              let signature = witness.toString('base64');
              if( onData ) {
                onData(signature)
              } else {
                socketRef.current.emit('hordes_response', {
                  channelId: data.channelId,
                  data: {
                    type: request.type,
                    payload: signature
                  }
                });
              }
              onCloseModalButtonPress();
            }

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

  /* ui */
  return (
    <Modal show={show}>
      <View className='w-full flex-1'>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={5} reducedTransparencyFallbackColor='white' />
        <CustomSafeAreaView cn='w-full flex-1'>
          <View className='w-full flex-1 justify-end'>
            <View className='w-full h-[97%] items-center bg-white rounded-t-xl android:pb-4'>
              <View className='w-full h-20 items-center justify-center'>
                <Text className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('HordesPlugin.SignMessageTitleText')}</Text>
                <Button className='absolute right-4 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
              </View>
              {request
                ?
                  <View className='w-full flex-1 px-4'>
                    <View className='w-full flex-1 justify-center'>
                      <ScrollView className='w-full flex-1' showsVerticalScrollIndicator={false}>
                        <View className='w-full items-center'>
                          <View className='w-full border border-light-gray rounded-lg px-4 py-3 mt-4'>
                            <Text className='font-gilroy-bold text-black text-sm'>{localize('HordesPlugin.SignMessageContentText')}</Text>
                            <Text className='font-gilroy text-dark-gray text-sm mt-2'>{request.message}</Text>
                          </View>
                          <View className='w-full border border-light-gray rounded-lg px-4 py-3 mt-4'>
                            <Text className='font-gilroy-bold text-black text-sm'>{localize('HordesPlugin.SignMessageSigningAddressText')}</Text>
                            <View className='w-full flex-row items-center justify-between'>
                              <Text className='font-gilroy text-dark-gray text-sm mt-2'>{localize('HordesPlugin.SignMessageOrdinalsAddressText')}</Text>
                              <Text className='font-gilroy text-dark-gray text-sm mt-2'>{ellipsis(request.address)}</Text>
                            </View>
                          </View>
                        </View>
                        <View className='w-full px-4 py-2 border border-light-gray rounded-lg mt-4'>
                          <Text className='font-gilroy text-black text-sm'>{localize('HordesPlugin.SignMessageNoteText1')}</Text>
                          <Text className='font-gilroy text-dark-gray text-xs mt-2'>{localize('HordesPlugin.SignMessageNoteText2')}</Text>
                        </View>
                        {processing
                          ?
                            <View className='w-full h-12 items-center mt-4'>
                              <ActivityIndicator size='large' />
                            </View>
                          :
                            <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-4' onPress={onApproveButtonPress}>
                              <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('HordesPlugin.SignMessageApproveText')}</Text>
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
