/* modules */
import { Fragment, useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';

/* assets */
import allWords from 'assets/jsons/words.json';

export default function WalletImport({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* states */
  const [words, setWords] = useState('');

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('WalletImport.HeaderText')}</Text>,
      headerLargeTitle: false,
      headerBackTitleVisible: false
    });

  }, []);

  /* actions */
  const onImportWalletButtonPress = () => {
    let errorFound = false;
    let trimWords = `${words}`;
    trimWords = trimWords.trim();
    if( trimWords.split(' ').length != 12 && trimWords.split(' ').length != 24 ) {
      Alert.alert('Hordes', localize('Error.PhraseLengthText'));
      return
    }
    trimWords.split(' ').forEach((userWord) => {
      if( allWords.indexOf(userWord) == -1 ) {
        errorFound = userWord;
      }
    });
    if( errorFound === false ) {
      navigation.push('WalletCreatePasscode', {
        mnemonic: words
      });
    } else {
      Alert.alert('Hordes', localize('WalletImport.InvalidWordText', [errorFound]));
    }
  }

  /* ui */
  return (
    <Fragment>
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white' insets={['bottom']}>
        <View className='w-full flex-1 px-4 py-8'>
          <Text className='font-gilroy text-black text-base'>{localize('WalletImport.TitleText')}</Text>
          <View className='w-full mt-4'>
            <TextInput multiline={true} textAlignVertical='top' className='w-full h-[300] font-gilroy text-dark-gray text-sm tracking-widest border border-light-gray rounded-lg p-4' value={words} placeholder={localize('WalletImport.RecoveryPhraseText')} placeholderTextColor='#68717b' textAlign='left' autoCorrect={false} autoCapitalize='none' onChangeText={(text) => setWords(text.replace(/[\r\n]+/g, ' '))} blurOnSubmit={true} />
          </View>
          <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-4' onPress={onImportWalletButtonPress}>
            <Text className='font-gilroy-bold text-white tracking-widest uppercase'>{localize('WalletImport.ContinueText')}</Text>
          </Button>
        </View>
      </CustomSafeAreaView>
    </Fragment>
  );

}
