/* modules */
import { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { validate as validBitcoinAddress } from 'bitcoin-address-validation';
import { getParams as parseLNUrl } from 'js-lnurl';
import { Camera, useCameraDevice, useCodeScanner, useCameraPermission } from 'react-native-vision-camera';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* utils */
import { emptyString } from 'utils/string';
import { parseInput } from 'utils/qr';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';

export default function QRScanner({ name, onClose, onData }) {

  /* refs */
  const qrResultRef = useRef(false);

  /* localization */
  const { localize } = useLocalization();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [validating, setValidating] = useState(false);

  const { hasPermission, requestPermission } = useCameraPermission();

  /* effects */
  useEffect(() => {
    setShow(true);
  }, []);

  useEffect(() => {
    if( hasPermission == false ) {
      requestPermission()
    }
  }, [hasPermission]);

  /* hooks */
  useBackHandler(() => {
    onCloseModalButtonPress(null);
    return true;
  });

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if( codes.length > 0 && qrResultRef.current == false ) {
        qrResultRef.current = true;
        let input = parseInput(codes[0].value);
        if( input ) {
          switch(input.type) {
            case 'url':
              onCloseModalButtonPress();
              Linking.openURL(input.url)
              break;
            case 'bitcoinAddress':
              onCloseModalButtonPress();
              setTimeout(() => {
                if( onData ) {
                  onData(input)
                } else {
                  showModal('WALLET_SEND', {
                    data: input
                  });
                }
              }, 250);
              break;
            case 'hordesRequest':
              switch (input.action) {
                case 'profile':
                  onCloseModalButtonPress();
                  setTimeout(() => {
                    showModal('PROFILE', {
                      data: input.params
                    });
                  }, 250);
                  break;
                case 'address':
                  onCloseModalButtonPress();
                  setTimeout(() => {
                    showModal('HORDES_ADDRESS', {
                      data: input.params
                    });
                  }, 250);
                  break;
                case 'signMessage':
                  onCloseModalButtonPress();
                  setTimeout(() => {
                    showModal('HORDES_SIGN_MESSAGE', {
                      data: input.params
                    });
                  }, 250);
                  break;
                case 'signTransaction':
                  onCloseModalButtonPress();
                  setTimeout(() => {
                    showModal('HORDES_SIGN_TRANSACTION', {
                      data: input.params
                    });
                  }, 250);
                  break;
              }
              break;
          }
        }
      }
    }
  });

  /* actions */
  const onCloseModalButtonPress = () => {
    setShow(false);
    setTimeout(async () => {
      if( onClose ) onClose();
      hideModal(name);
    }, 250);
  }

  /* ui */
  const device = useCameraDevice('back');

  return (
    <Modal show={show}>
      <View className='w-full flex-1'>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={4} reducedTransparencyFallbackColor='white' />
        <CustomSafeAreaView cn='w-full flex-1' insets={[]}>
          <View className='w-full h-16 items-center justify-center border-b-white border-b-solid' style={{ borderBottomWidth: 1.2 }}>
            <Text className='font-gilroy text-white text-base'>{localize('QRScanner.HeaderText')}</Text>
            <Button className='absolute right-4 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
          </View>
          <View className='w-full flex-1 items-center justify-center'>
            <View className='w-[90%] aspect-square rounded-xl overflow-hidden'>
              {device
                ?
                  <Camera style={{ width: '100%', height: '100%' }} device={device} isActive={true} codeScanner={codeScanner} enableZoomGesture={true} />
                :
                  null
              }
            </View>
            {validating ? <View className='absolute w-full h-full items-center justify-center'><View className='p-6 rounded-xl bg-white'><ActivityIndicator size='large' color='#68717b' /></View></View> : null}
          </View>
        </CustomSafeAreaView>
      </View>
    </Modal>
  );

}
