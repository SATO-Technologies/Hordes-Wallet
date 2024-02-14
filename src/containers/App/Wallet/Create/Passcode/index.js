/* modules */
import { Fragment, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import SmoothPinCodeInput from 'react-native-smooth-pincode-input';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import Keyboard from 'components/Keyboard';

/* contexts */
import { useLocalization } from 'contexts/localization';

export default function WalletCreatePasscode({ navigation, route: { params } }) {

  /* localization */
  const { localize } = useLocalization();

  /* refs */
  const pinInputRef = useRef();

  /* states */
  const [passcode, setPasscode] = useState('');

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize(`WalletCreate.Passcode${params.passcode ? 'Confirm' : ''}HeaderText`)}</Text>,
      headerLargeTitle: false,
      headerBackTitleVisible: false
    });

  }, []);

  useEffect(() => {
    if( passcode.length == 6 ) {
      onContinueButtonPress();
    }
  }, [passcode]);

  /* actions */
  const onContinueButtonPress = () => {
    if( params.passcode ) {
      if( params.passcode === passcode ) {
        navigation.push('WalletCreateBiometrics', {
          ...params
        });
      } else {
        pinInputRef.current?.shake();
      }
    } else {
      navigation.push('WalletCreatePasscodeConfirm', {
        ...params,
        passcode: passcode
      });
    }
  }

  /* ui */
  return (
    <Fragment>
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white' insets={['bottom']}>
        <View className='w-full flex-1 px-4 pt-8'>
          <Text className='font-gilroy text-dark-gray'>{localize(`WalletCreate.Passcode${params.passcode ? 'Confirm' : ''}TitleText`)}</Text>
          <View className='w-full items-center my-8'>
            <SmoothPinCodeInput ref={pinInputRef} editable={false} password value={passcode} onTextChange={setPasscode} restrictToNumbers={true} codeLength={6} cellSpacing={10} cellStyle={{ width: (Dimensions.get('window').width - 50 - 40) / 6, borderRadius: 10, borderColor: '#f2f4f7', borderWidth: 2 }} cellStyleFocused={{ borderRadius: 10, borderColor: '#303030', borderWidth: 2 }} mask={<View className='w-2 h-2 rounded-full bg-black' />} maskDelay={0} />
          </View>
          <Text className='font-gilroy text-dark-gray'>{localize(`WalletCreate.Passcode${params.passcode ? 'Confirm' : ''}DescText`)}</Text>
          <View className='w-full flex-1 justify-end'>
            <Keyboard onPress={(value) => value == '<' ? setPasscode(passcode.slice(0, -1)) : setPasscode(`${passcode}${passcode.length < 6 ? value : ''}`)} />
          </View>
        </View>
      </CustomSafeAreaView>
    </Fragment>
  );

}
