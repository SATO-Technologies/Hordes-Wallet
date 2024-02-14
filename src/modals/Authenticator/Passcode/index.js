/* modules */
import { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import SmoothPinCodeInput from 'react-native-smooth-pincode-input';
import CryptoJS from 'crypto-js';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import Keyboard from 'components/Keyboard';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

export default function AuthenticatorPasscode({ name, mnemonic, onSuccess }) {

  /* refs */
  const pinInputRef = useRef();

  /* localization */
  const { localize } = useLocalization();

  /* modals context */
  const { hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [passcode, setPasscode] = useState('');

  /* effects */
  useEffect(() => {
    setShow(true);
  }, []);

  useEffect(() => {

    if( passcode.length == 6 ) {
      let decryptedMnemonic = CryptoJS.AES.decrypt(mnemonic, passcode);
      if( decryptedMnemonic ) {
        try {
          decryptedMnemonic = decryptedMnemonic.toString(CryptoJS.enc.Utf8);
          if( (decryptedMnemonic.split(' ').length == 12 || decryptedMnemonic.split(' ').length == 24) ) {
            onCloseModalButtonPress();
            onSuccess(decryptedMnemonic);
          } else {
            pinInputRef.current?.shake();
          }
        } catch {
          pinInputRef.current?.shake();
        }
      }
    }

  }, [passcode]);

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
        <View className='w-full flex-1 px-4 pt-16'>
          <Text className='font-gilroy text-black text-lg text-center'>{localize('Authenticator.PasscodeTitleText')}</Text>
          <View className='w-full items-center my-8'>
            <SmoothPinCodeInput ref={pinInputRef} editable={false} password value={passcode} onTextChange={setPasscode} restrictToNumbers={true} codeLength={6} cellSpacing={10} cellStyle={{ width: (Dimensions.get('window').width - 50 - 40) / 6, borderRadius: 10, borderColor: '#f2f4f7', borderWidth: 2 }} cellStyleFocused={{ borderRadius: 10, borderColor: '#303030', borderWidth: 2 }} mask={<View className='w-2 h-2 rounded-full bg-black' />} maskDelay={0} />
          </View>
          <View className='w-full flex-1 justify-end'>
            <Keyboard onPress={(value) => value == '<' ? setPasscode(passcode.slice(0, -1)) : setPasscode(`${passcode}${passcode.length < 6 ? value : ''}`)} />
          </View>
        </View>
      </CustomSafeAreaView>
    </Modal>
  );

}
