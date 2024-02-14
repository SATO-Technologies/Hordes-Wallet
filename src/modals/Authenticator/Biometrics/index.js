/* modules */
import { useState, useEffect, useContext } from 'react';
import { View, Text, Dimensions } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* assets */
import FaceIdLogo from 'assets/svgs/faceId.svg';
import TouchIdLogo from 'assets/svgs/touchId.svg';

export default function AuthenticatorBiometrics({ name, onSuccess }) {

  /* localization */
  const { localize } = useLocalization();

  /* modals context */
  const { hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [biometricsType, setBiometricsType] = useState(null);

  /* effects */
  useEffect(() => {
    setShow(true);
  }, []);

  /* screen states */
  useEffect(() => {

    if( show == true ) {

      /* launch biometrics */
      launchBiometris();

    }

  }, [show]);

  /* actions */
  const launchBiometris = async () => {
    setShowAction(false);

    let rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true })
    let result = await rnBiometrics.isSensorAvailable();

    const { available, biometryType } = result

    if( available && biometryType === BiometryTypes.TouchID ) {
      setBiometricsType('Touch ID');
    } else if( available && biometryType === BiometryTypes.FaceID ) {
      setBiometricsType('Face ID');
    } else if( available && biometryType === BiometryTypes.Biometrics ) {
      setBiometricsType('Biometrics');
    }

    if( available ) {
      rnBiometrics.simplePrompt({ promptMessage: 'Authenticate' }).then((resultObject) => {
        const { success } = resultObject;
        if( success ) {
          if( onSuccess ) onSuccess();
          onCloseModalButtonPress();
        } else {
          setShowAction(true);
        }
      }).catch((error) => {
        setShowAction(true);
      })
    } else {
      onCloseModalButtonPress();
    }

  }

  /* hooks */
  useBackHandler(() => {
    return true;
  });

  /* actions */
  const onCloseModalButtonPress = () => {
    setShow(false);
    setTimeout(async () => {
      hideModal(name);
    }, 250);
  }

  /* ui */
  return (
    <Modal show={show} animation='fade'>
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white' insets={['bottom-w-nav']}>
        <View className='w-full flex-1 items-center justify-end px-4 pt-16 pb-8'>
          <Button className='w-20 h-20' onPress={launchBiometris}>{biometricsType == 'Face ID' ? <FaceIdLogo /> : <TouchIdLogo />}</Button>
          <Text className='font-gilroy text-black text-lg text-center mt-4'>{biometricsType}</Text>
        </View>
      </CustomSafeAreaView>
    </Modal>
  );

}
