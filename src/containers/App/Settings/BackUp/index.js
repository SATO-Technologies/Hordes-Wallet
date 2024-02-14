/* modules */
import { Fragment, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CryptoJS from 'crypto-js';
import Clipboard from '@react-native-clipboard/clipboard';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* assets */
import CheckOnLogo from 'assets/svgs/checkOn.svg';

export default function BackUp({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { account, updateAccount } = useAccount();

  /* account context */
  const { wallet } = useWallet();

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [mnemonic, setMnemonic] = useState([]);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: account.backup == true ? '' : (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('BackUp.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, [account.backup]);

  useFocusEffect(useCallback(() => {
    if( account.backup == true ) setMnemonic([]);
  }, [account.backup]));

  useEffect(() => {
    if( account.backup == true ) return;

    showModal('PASSCODE_AUTHENTICATOR', {
      mnemonic: wallet.mnemonic,
      onSuccess: (decryptedMnemonic) => {
        setMnemonic(decryptedMnemonic.split(' '));
      }
    });
  }, [wallet, account]);

  /* actions */
  const onCopyButtonPress = () => {
    Clipboard.setString(mnemonic.join(' '));
    showModal('RESPONSE', {
      type: 'SUCCESS',
      message: localize('General.CopiedText')
    });
  }

  const onRevealSecretButtonPress = () => {
    showModal('PASSCODE_AUTHENTICATOR', {
      mnemonic: wallet.mnemonic,
      onSuccess: (decryptedMnemonic) => {
        setMnemonic(decryptedMnemonic.split(' '));
      }
    });
  }

  const onHideSecretButtonPress = () => {
    setMnemonic([]);
  }

  const onContinueButtonPress = () => {
    navigation.push('BackUpFinalize', {
      mnemonic: mnemonic
    });
  }

  /* ui */
  if( account.backup == true ) {
    return (
      <Fragment>
        <CustomSafeAreaView cn='flex-1 items-center bg-white' insets={['bottom']}>
          {mnemonic.length == 0
            ?
              <View className='w-full flex-1 items-center justify-center'>
                <View className='w-24 h-24'><CheckOnLogo /></View>
                <View className='w-full items-center mt-4'>
                  <Text className='font-gilroy text-dark-gray text-lg text-center'>{localize('BackUp.WalletBackedUpText1')}</Text>
                  <Text className='font-gilroy-bold text-black text-2xl text-center'>{localize('BackUp.WalletBackedUpText2')}</Text>
                </View>
              </View>
            :
              <ScrollView className='w-full flex-1 px-4 pt-4' contentContainerStyle={{ flex: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
                <View className='w-full flex-row flex-wrap'>
                  {mnemonic.map((word, index) => {
                    return (
                      <View key={index} className='w-[33%] py-2'>
                        <Text className='font-gilroy text-dark-gray'>{index + 1}. <Text className='font-gilroy-bold text-dark-gray'>{word}</Text></Text>
                      </View>
                    )
                  })}
                </View>
                <Button className='w-full h-12 items-center justify-center rounded-full bg-light-gray mt-4' onPress={onCopyButtonPress}>
                  <Text className='font-gilroy-bold text-black text-base'>{localize('BackUp.CopyText')}</Text>
                </Button>
              </ScrollView>
          }
          <View className='w-full px-4 mb-4'>
            <Button className='w-full h-12 items-center justify-center rounded-lg bg-black' onPress={mnemonic.length == 0 ? onRevealSecretButtonPress : onHideSecretButtonPress}>
              <Text className='font-gilroy-bold text-white text-base'>{mnemonic.length == 0 ? localize('BackUp.RevealSecretPhraseText') : localize('BackUp.HideSecretPhraseText')}</Text>
            </Button>
          </View>
        </CustomSafeAreaView>
      </Fragment>
    )
  }
  return (
    <Fragment>
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white'>
        <ScrollView className='w-full flex-1 px-4 pt-4' showsVerticalScrollIndicator={false}>
          <Text className='font-gilroy text-black text-base'>{localize('BackUp.TitleText1')} <Text className='font-gilroy-bold text-black'>{localize('BackUp.TitleText2', [mnemonic.length])}</Text> {localize('BackUp.TitleText3', [mnemonic.length])}</Text>
          <Text className='font-gilroy-bold text-black text-base mt-4'>{localize('BackUp.RecoverText')}</Text>
          <View className='w-full flex-row flex-wrap mt-8'>
            {mnemonic.map((word, index) => {
              return (
                <View key={index} className='w-[33%] py-2'>
                  <Text className='font-gilroy text-dark-gray'>{index + 1}. <Text className='font-gilroy-bold text-dark-gray'>{word}</Text></Text>
                </View>
              )
            })}
          </View>
          <Button className='w-full h-12 items-center justify-center rounded-full bg-light-gray mt-4' onPress={onCopyButtonPress}>
            <Text className='font-gilroy-bold text-black text-base'>{localize('BackUp.CopyText')}</Text>
          </Button>
        </ScrollView>
        <View className='w-full px-4 mb-4'>
          <Button className='w-full h-12 items-center justify-center rounded-lg bg-black' onPress={onContinueButtonPress}>
            <Text className='font-gilroy-bold text-white text-base'>{localize('BackUp.ContinueText')}</Text>
          </Button>
        </View>
      </CustomSafeAreaView>
    </Fragment>
  );

}
