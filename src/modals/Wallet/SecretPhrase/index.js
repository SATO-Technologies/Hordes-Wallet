/* modules */
import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { BlurView } from '@react-native-community/blur';

/* components */
import Modal from 'components/Modal';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

export default function WalletSecretPhrase({ name, onChoose }) {

  /* localization */
  const { localize } = useLocalization();

  /* modals context */
  const { hideModal } = useModals();

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
      hideModal(name);
      onChoose(length);
    }, 250);
  }

  /* ui */
  return (
    <Modal show={show}>
      <View className='w-full flex-1'>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={5} reducedTransparencyFallbackColor='white' />
        <View className='w-full flex-1 justify-end'>
          <View className='w-full items-center px-4 py-8 bg-white rounded-t-xl'>
            <Button className='w-full h-12 items-center justify-center bg-black rounded-lg' onPress={() => onCloseModalButtonPress(128)}>
              <Text className='font-gilroy-bold text-white uppercase tracking-widest'>{localize('WalletCreate.CreateSeed12Text')}</Text>
            </Button>
            <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-4' onPress={() => onCloseModalButtonPress(256)}>
              <Text className='font-gilroy-bold text-white uppercase tracking-widest'>{localize('WalletCreate.CreateSeed24Text')}</Text>
            </Button>
            <Button className='w-full h-12 items-center justify-center rounded-lg mt-4' onPress={() => onCloseModalButtonPress(null)}>
              <Text className='font-gilroy-bold text-black uppercase tracking-widest'>{localize('WalletCreate.DismissText')}</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

}
