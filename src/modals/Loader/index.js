/* modules */
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { BlurView } from '@react-native-community/blur';

/* components */
import Modal from 'components/Modal';

/* contexts */
import { useModals } from 'contexts/modals';

export default function Loader({ name }) {

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);

  /* effects */
  useEffect(() => {
    setShow(true);
  }, []);

  /* ui */
  return (
    <Modal show={show} animation='fade'>
      <View className='w-full flex-1 items-center justify-center'>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={4} reducedTransparencyFallbackColor='white' />
        <ActivityIndicator size='large' color='white' />
      </View>
    </Modal>
  );

}
