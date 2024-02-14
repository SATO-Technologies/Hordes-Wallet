/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList } from 'react-native';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';

/* assets */
import CheckOnLogo from 'assets/svgs/checkOn.svg';

export default function SettingsLanguage({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { account, updateAccount } = useAccount();

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Settings.LanguagesHeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* actions */
  const onLanguageButtonPress = async (languageSelected) => {
    await updateAccount('language', languageSelected);
  }

  /* ui */
  const drawLanguageItem = ({ item: language, index }) => {
    return (
      <Button className='w-full h-12 items-center flex-row border-b-solid border-b-light-gray px-4' style={{ borderBottomWidth: 1.2 }} onPress={() => onLanguageButtonPress(language.value)}>
        <View className='flex-1'><Text className='font-gilroy text-black text-lg'>{language.key}</Text></View>
        <View className='w-5 h-5'>{account.language == language.value ? <CheckOnLogo /> : null}</View>
      </Button>
    )
  }

  return (
    <CustomSafeAreaView cn='w-full flex-1 items-center justify-start bg-white' insets={[]}>
      <FlatList className='w-full ios:pt-8 android:pt-4' data={[{ key: 'English 🇺🇲', value: 'en' }]} renderItem={drawLanguageItem} keyExtractor={(item) => item.value} showsVerticalScrollIndicator={false} />
    </CustomSafeAreaView>
  )

}
