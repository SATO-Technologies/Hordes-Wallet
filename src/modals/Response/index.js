/* modules */
import { useState, useEffect, useContext } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';

/* contexts */
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* assets */
import ErrorLogo from 'assets/svgs/error.svg';
import AlertLogo from 'assets/svgs/alertWhite.svg';
import SuccessLogo from 'assets/svgs/ok.svg';

export default function Response({ name, type = 'ERROR', message = '' }) {

  /* modals context */
  const { hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);

  /* effects */
  useEffect(() => {
    setShow(true);

    setTimeout(() => {
      onCloseModalButtonPress();
    }, 4000);
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
    }, 250);
  }

  /* ui */
  return (
    <Modal show={show} pointerEvents='none'>
      <View className='w-full flex-1 justify-end'>
        <CustomSafeAreaView className='w-full flex-1 justify-end'>
          <View className={`w-full items-center justify-center py-2 ${type == 'ERROR' ? 'bg-red' : type == 'WARNING' ? 'bg-orange' : 'bg-green'}`}>
            <View className='absolute left-4 w-8 h-8 items-center justify-center'>{type == 'ERROR' ? <ErrorLogo /> : type == 'WARNING' ? <AlertLogo /> : <SuccessLogo />}</View>
            <View className='w-[70%] items-center justify-center' style={{ minHeight: type == 'WARNING' ? 40 : 60 }}>
              <Text className='font-gilroy-bold text-white text-sm text-center'>{message}</Text>
            </View>
          </View>
        </CustomSafeAreaView>
        <SafeAreaView className={`flex-0 ${type == 'ERROR' ? 'bg-red' : type == 'WARNING' ? 'bg-orange' : 'bg-green'}`} />
      </View>
    </Modal>
  );

}
