/* modules */
import { Fragment, useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import InscriptionsList from 'components/Inscription/List';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';

export default function ProfileChooseImage({ name, onClose, data }) {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { updateAccount } = useAccount();

  /* wallet context */
  const { inscriptions } = useWallet();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);

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
  const onCloseModalButtonPress = (length) => {
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
            <View className='w-full h-[98%] items-center bg-white rounded-t-xl'>
              <View className='w-full h-20 items-center justify-center'>
                <Text className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Profile.ChooseImageHeaderText')}</Text>
                <Button className='absolute right-4 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
              </View>
              <ScrollView className='w-full h-full' showsVerticalScrollIndicator={false}>
                <View className='w-full items-center px-4 mt-6'>
                  <InscriptionsList inscriptions={inscriptions} onPress={(inscription) => { updateAccount('profile.icon', { id: inscription.id, content_type: inscription.content_type }); onCloseModalButtonPress() }} />
                </View>
              </ScrollView>
            </View>
          </View>
        </CustomSafeAreaView>
        <SafeAreaView className='flex-0 bg-white' />
      </View>
    </Modal>
  );

}
