/* modules */
import { Fragment, useState, useEffect,useLayoutEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import AccountProvider, { useAccount } from 'contexts/account';
import { useModals } from 'contexts/modals';

/* uitls */
import { shuffleArray } from 'utils/array';

export default function BackUpFinalize({ navigation, route: { params: { mnemonic } } }) {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { updateAccount } = useAccount();

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [words, setWords] = useState(shuffleArray([...mnemonic]));
  const [indexes] = useState(mnemonic.length == 12 ? [3, 6, 9, 12] : [6, 12, 18, 24]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('BackUp.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* actions */
  const onWordButtonPress = (word) => {
    let selected = [...selectedWords];
    selected[currentIndex] = word;
    setSelectedWords(selected);
    if( currentIndex < 3 ) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  /* actions */
  const onContinueButtonPress = async () => {
    let selected = selectedWords.join(' ');
    let check = `${mnemonic[indexes[0]-1]} ${mnemonic[indexes[1]-1]} ${mnemonic[indexes[2]-1]} ${mnemonic[indexes[3]-1]}`;
    if( selected === check ) {
      await updateAccount('backup', true);
      navigation.popToTop();
    } else {
      Alert.alert('Hordes', 'Wrong mnemonic');
    }
  }

  /* ui */
  return (
    <Fragment>
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white'>
        <ScrollView className='w-full flex-1 px-4 pt-4' showsVerticalScrollIndicator={false}>
          <Text className='font-gilroy text-black text-lg'>{localize('BackUp.FinalizeTitleText1')} <Text className='font-gilroy-bold text-black'>{localize('BackUp.FinalizeTitleText2')}</Text></Text>
          <Text className='font-gilroy text-black mt-6'>{localize('BackUp.FinalizeDescText', [mnemonic.length == 12 ? '3, 6, 9 and 12' : '6, 12, 18 and 24'])}</Text>
          <View className='w-full mt-4'>
            <View className='w-full flex-row items-center'>
              <Button className='flex-1 h-12 justify-center border border-black rounded-lg px-4' style={{ borderWidth: currentIndex == 0 ? 1.2 : 0 }} onPress={() => setCurrentIndex(0)}><Text className='font-gilroy-bold text-black text-base'>{indexes[0]}. <Text>{selectedWords[0] || ''}</Text></Text></Button>
              <View className='w-4' />
              <Button className='flex-1 h-12 justify-center border border-black rounded-lg px-4' style={{ borderWidth: currentIndex == 1 ? 1.2 : 0 }} onPress={() => setCurrentIndex(1)}><Text className='font-gilroy-bold text-black text-base'>{indexes[1]}. <Text>{selectedWords[1] || ''}</Text></Text></Button>
            </View>
            <View className='w-full flex-row items-center mt-4'>
              <Button className='flex-1 h-12 justify-center border border-black rounded-lg px-4' style={{ borderWidth: currentIndex == 2 ? 1.2 : 0 }} onPress={() => setCurrentIndex(2)}><Text className='font-gilroy-bold text-black text-base'>{indexes[2]}. <Text>{selectedWords[2] || ''}</Text></Text></Button>
              <View className='w-4' />
              <Button className='flex-1 h-12 justify-center border border-black rounded-lg px-4' style={{ borderWidth: currentIndex == 3 ? 1.2 : 0 }} onPress={() => setCurrentIndex(3)}><Text className='font-gilroy-bold text-black text-base'>{indexes[3]}. <Text>{selectedWords[3] || ''}</Text></Text></Button>
            </View>
          </View>
          <View className='w-full flex-row flex-wrap mt-4'>
            {words.map((word, index) => {
              return (
                <Button key={index} className='px-4 py-2 rounded-lg bg-light-gray mt-3 mr-3' onPress={() => onWordButtonPress(word)}><Text className='font-gilroy-bold text-dark-gray'>{word}</Text></Button>
              )
            })}
          </View>
        </ScrollView>
        <View className='w-full px-4 mb-4'>
          <Button className='w-full h-12 items-center justify-center rounded-lg bg-black' onPress={onContinueButtonPress}>
            <Text className='font-gilroy-bold text-white text-base'>{localize('BackUp.FinalizeContinueText')}</Text>
          </Button>
        </View>
      </CustomSafeAreaView>
    </Fragment>
  );

}
