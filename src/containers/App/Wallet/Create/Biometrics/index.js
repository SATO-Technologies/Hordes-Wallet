/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';

/* assets */
import FaceIdLogo from 'assets/svgs/faceId.svg';
import TouchIdLogo from 'assets/svgs/touchId.svg';

export default function WalletCreateBiometrics({ navigation, route: { params } }) {

  /* localization */
  const { localize } = useLocalization();

  /* states */
  const [biometricsType, setBiometricsType] = useState(null);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: '',
      headerLargeTitle: false,
      headerBackTitleVisible: false
    });

  }, []);

  useEffect(() => {

    async function doAsyncRequest() {
      let rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
      let result = await rnBiometrics.isSensorAvailable();
      const { available, biometryType } = result
      if( available && biometryType === BiometryTypes.TouchID ) {
        setBiometricsType('Touch ID');
      } else if( available && biometryType === BiometryTypes.FaceID ) {
        setBiometricsType('Face ID');
      } else if( available && biometryType === BiometryTypes.Biometrics ) {
        setBiometricsType('Biometrics');
      }
    }
    doAsyncRequest();

  }, []);

  /* actions */
  const onEnableBiometricsButtonPress = async () => {
    let rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
    let result = await rnBiometrics.isSensorAvailable();
    const { available } = result
    if( available ) {
      rnBiometrics.simplePrompt({ promptMessage: 'Authenticate' }).then((resultObject) => {
        const { success } = resultObject;
        if( success ) {
          onContinueButtonPress(true);
        }
      }).catch((error) => { })
    } else {
      onContinueButtonPress(false);
    }
  }

  const onContinueButtonPress = (enableBiometrics = false) => {
    navigation.push('WalletCreateFinalize', {
      ...params,
      biometrics: enableBiometrics
    });
  }

  /* ui */
  return (
    <Fragment>
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white' insets={['bottom']}>
        <View className='w-full flex-1 items-center px-4 pt-8'>
          {biometricsType == 'Face ID' ? <FaceIdLogo width={100} height={100} /> : <TouchIdLogo width={100} height={100} />}
          <Text className='font-gilroy-bold text-blakc text-2xl mt-8'>{localize('WalletCreate.BiometricsTitleText', [biometricsType])}</Text>
          <Text className='font-gilroy text-dark-gray text-base text-center mt-4'>{localize('WalletCreate.BiometricsDescText')}</Text>
          <View className='w-full flex-1 justify-end'>
            <Button className='w-full h-12 items-center justify-center bg-black rounded-lg' onPress={onEnableBiometricsButtonPress}>
              <Text className='font-gilroy-bold text-white'>{localize('WalletCreate.BiometricsTitleText', [biometricsType])}</Text>
            </Button>
            <Button className='w-full h-12 items-center justify-center rounded-lg mt-4' onPress={onContinueButtonPress}>
              <Text className='font-gilroy-bold text-black'>{localize('WalletCreate.BiometricsSkipText')}</Text>
            </Button>
          </View>
        </View>
      </CustomSafeAreaView>
    </Fragment>
  );

}
