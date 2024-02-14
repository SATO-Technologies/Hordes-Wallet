/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import CryptoJS from 'crypto-js';
import * as bip39 from 'bip39';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';

/* utils */
import { saveItem } from 'utils/storage';

/* assets */
import CheckOffLogo from 'assets/svgs/checkOff.svg';
import CheckOnLogo from 'assets/svgs/checkOn.svg';

export default function WalletCreateFinalize({ navigation, route: { params: { mnemonic, passcode, biometrics } } }) {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { updateAccount } = useAccount();

  /* wallet context */
  const { initializeWallet, setWallet } = useWallet();

  /* states */
  const [creationStep, setCreationStep] = useState(0);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('WalletCreate.FinalizeHeaderText')}</Text>,
      headerLargeTitle: false,
      headerBackVisible: false
    });

  }, []);

  useEffect(() => {

    setTimeout(() => {
      setCreationStep(1);
      setTimeout(() => {
        setCreationStep(2);
        setTimeout(async () => {

          /* save locally account data */
          await updateAccount('biometrics', biometrics);

          /* generate wallet id */
          let derivationPath = {
            purpose: `86`,
            coinType: `0`,
            account: `0`,
            change: `0`,
            addressIndex: '*'
          }
          let type = 'tr';
          let index = 0;
          let seed = bip39.mnemonicToSeedSync(mnemonic);
          let seedAsHex = Buffer.from(Uint8Array.from(seed)).toString('hex');
          derivation = CryptoJS.HmacSHA256('wallet-id-derivation', seedAsHex).toString();
          let walletId = `${derivation}-${type}-${index}`;

          /* save locally sensitive data encrypted */
          let newWallet = {
            id: walletId,
            mnemonic: CryptoJS.AES.encrypt(mnemonic, passcode).toString(),
            derivationPath: derivationPath
          }
          await saveItem('wallet', newWallet);
          setWallet(newWallet);

          /* initialize wallet */
          await initializeWallet({
            id: `${derivation}-${type}-${index}`,
            mnemonic: mnemonic,
            derivationPath: derivationPath,
            updateAccount: updateAccount
          });

          /* finalize wallet creation */
          setCreationStep(3);

        }, 500);
      }, 500);
    }, 500);

  }, []);

  useEffect(() => {
    if( creationStep == 3 ) {
      setTimeout(() => {
        navigation.popToTop();
      }, 500);
    }
  }, [creationStep]);

  /* ui */
  return (
    <Fragment>
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white' insets={['bottom']}>
        <View className='w-full flex-1 justify-center px-12 pt-8'>
          <View className='w-full flex-row items-center'>
            {creationStep == 0 ? <ActivityIndicator size='large' color='#303030' /> : creationStep > 0 ? <CheckOnLogo width={35} height={35} /> : <CheckOffLogo width={35} height={35} />}
            <View className='flex-1 ml-4'>
              <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletCreate.FinalizeStep1Text')}</Text>
            </View>
          </View>
          <View className='w-full flex-row items-center mt-8'>
            {creationStep == 1 ? <ActivityIndicator size='large' color='#303030' /> : creationStep > 1 ? <CheckOnLogo width={35} height={35} /> : <CheckOffLogo width={35} height={35} />}
            <View className='flex-1 ml-4'>
              <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletCreate.FinalizeStep2Text')}</Text>
            </View>
          </View>
          <View className='w-full flex-row items-center mt-8'>
            {creationStep == 2 ? <ActivityIndicator size='large' color='#303030' /> : creationStep > 2 ? <CheckOnLogo width={35} height={35} /> : <CheckOffLogo width={35} height={35} />}
            <View className='flex-1 ml-4'>
              <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletCreate.FinalizeStep3Text')}</Text>
            </View>
          </View>
          <View className='w-full flex-row items-center mt-8'>
            {creationStep == 3 ? <CheckOnLogo width={35} height={35} /> : <CheckOffLogo width={35} height={35} />}
            <View className='flex-1 ml-4'>
              <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletCreate.FinalizeStep4Text')}</Text>
            </View>
          </View>
        </View>
      </CustomSafeAreaView>
    </Fragment>
  );

}
