/* modules */
import { Fragment, useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

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

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* utils */
import { emptyString, ellipsis } from 'utils/string';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';
import BackLogo from 'assets/svgs/arrow.svg';
import HordesLogo from 'assets/svgs/hordesShare.svg';

export default function HordesAddress({ name, onClose, data = { }, onData = null }) {

  /* refs */
  const socketRef = useRef(null);

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { address, publicKey } = useWallet();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);
  const [request, setRequest] = useState(null);
  const [processing, setProcessing] = useState(false);

  /* effects */
  useEffect(() => {

    setShow(true);

    const fillRequest = (decodedToken) => {
      setRequest({
        purposes: decodedToken.purposes,
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
        if( request ) {
          if( request.message ) {
            fillRequest(request);
          } else if( request.token ) {
            fillRequest(jwtDecode(request.token));
          }
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

    const approveRequest = () => {
      setProcessing(true);

      let payload = {
        addresses: [
          {
            address: address.ordinals,
            publicKey: publicKey.ordinals,
            purpose: 'ordinals',
          },
          {
            address: address.payments,
            publicKey: publicKey.payments,
            purpose: 'payment',
          }
        ]
      }
      if( onData ) {
        onData(payload)
      } else {
        socketRef.current.emit('hordes_response', {
          channelId: data.channelId,
          data: {
            type: request.type,
            payload: payload
          }
        });
      }
      onCloseModalButtonPress();
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
            <View className='w-full h-[75%] items-center bg-white rounded-t-xl android:pb-4'>
              <View className='w-full h-20 items-center justify-center'>
                <Text className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('HordesPlugin.AddressTitleText')}</Text>
                <Button className='absolute right-4 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
              </View>
              {request
                ?
                  <View className='w-full flex-1 px-4'>
                    <View className='w-full flex-1 justify-center'>
                      <View className='w-full items-center px-12'>
                        <Text className='font-gilroy text-black text-base text-center mt-2'>{request.message}</Text>
                      </View>
                      <View className='w-full border border-light-gray rounded-lg mt-4'>
                        <View className='w-full p-4'>
                          <View className='w-full flex-row items-center'>
                            <View className='flex-1'><Text className='font-gilroy-bold text-black text-sm'>{localize('Profile.OrdinalsAddressText')}</Text></View>
                          </View>
                          <Text className='font-gilroy text-dark-gray text-xs mt-4'>{address.ordinals}</Text>
                        </View>
                        <View className='w-full border-t border-t-light-gray' />
                        <View className='w-full p-4'>
                          <View className='w-full flex-row items-center'>
                            <View className='flex-1'><Text className='font-gilroy-bold text-black text-sm'>{localize('Profile.PaymentsAddressText')}</Text></View>
                          </View>
                          <Text className='font-gilroy text-dark-gray text-xs mt-4'>{address.payments}</Text>
                        </View>
                      </View>
                    </View>
                    {processing
                      ?
                        <View className='w-full h-12 items-center mt-8'>
                          <ActivityIndicator size='large' />
                        </View>
                      :
                        <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-8' onPress={onApproveButtonPress}>
                          <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('HordesPlugin.AddressApproveText')}</Text>
                        </Button>
                    }
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
