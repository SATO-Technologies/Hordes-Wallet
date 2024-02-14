/* modules */
import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';

export default function WalletDelete({ name }) {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { deleteAccount } = useAccount();

  /* wallet context */
  const { status, deleteWallet } = useWallet();

  /* modals context */
  const { hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [processing, setProcessing] = useState(false);

  /* effects */
  useEffect(() => {
    setShow(true);
  }, []);

  /* hooks */
  useBackHandler(() => {
    onCloseModalButtonPress(null);
    return true;
  });

  /* actions */
  const onCloseModalButtonPress = () => {
    setShow(false);
    setTimeout(async () => {
      hideModal(name);
    }, 250);
  }

  const onDeleteAccountButtonPress = async () => {
    if( status == 'WALLET_READY' ) {
      setProcessing(true);
      await deleteAccount();
      await deleteWallet();
      onCloseModalButtonPress();
    } else {
      Alert.alert('Hordes', 'Wallet is syncing, wait until ends to delete the account')
    }
  }

  /* ui */
  return (
    <Modal show={show}>
      <View className='w-full flex-1'>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={5} reducedTransparencyFallbackColor='white' />
        <CustomSafeAreaView cn='w-full flex-1'>
          <View className='w-full flex-1 justify-end'>
            <View className='w-full items-center px-4 bg-white rounded-t-xl'>
              <View className='w-full h-20 items-center justify-center'>
                <Text className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('WalletDelete.HeaderText')}</Text>
                <Button className='absolute right-0 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
              </View>
              <View className='w-full my-8'>
                <Text className='font-gilroy text-dark-gray text-base text-center'>{localize('WalletDelete.DescText')}</Text>
                {processing
                  ?
                    <View className='w-full h-12 items-center justify-center mt-8'>
                      <ActivityIndicator size='large' color='#303030' />
                    </View>
                  :
                    <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-8' onPress={onDeleteAccountButtonPress}>
                      <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('WalletDelete.ActionText')}</Text>
                    </Button>
                }
              </View>
            </View>
          </View>
        </CustomSafeAreaView>
        <SafeAreaView className='flex-0 bg-white' />
      </View>
    </Modal>
  );

}
