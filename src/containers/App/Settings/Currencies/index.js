/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList } from 'react-native';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useCurrencies } from 'contexts/currencies';

/* assets */
import CheckOnLogo from 'assets/svgs/checkOn.svg';

export default function SettingsCurrencies({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* variables */
  let supportedCurrencies = [
    { title: '$ - US Dollar', symbol: 'USD' },
    { title: '€- Euro', symbol: 'EUR' },
    { title: 'CA$ - Canadian Dollar', symbol: 'CAD' },
    { title: '£ - Pound Sterling', symbol: 'GBP' },
    { title: '￥ - Yuan Renminbi', symbol: 'JPY' }
  ]

  /* account context */
  const { account, updateAccount } = useAccount();

  /* currencies context */
  const { currencies } = useCurrencies();

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Settings.CurrenciesHeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* actions */
  const onFiatCurrencyButtonPress = async (fiatCurrencySelected) => {
    await updateAccount('currencies.fiat', fiatCurrencySelected);
  }

  /* ui */
  const drawCurrencyItem = ({ item: currency, index }) => {
    return (
      <Button className='w-full h-12 items-center flex-row border-b-solid border-b-light-gray px-4' style={{ borderBottomWidth: 1.2 }} onPress={() => onFiatCurrencyButtonPress(currency.symbol)}>
        <View className='flex-1'><Text className='font-gilroy text-black text-lg'>{currency.title}</Text></View>
        <View className='w-5 h-5'>{account.currencies.fiat == currency.symbol ? <CheckOnLogo /> : null}</View>
      </Button>
    )
  }

  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <FlatList className='w-full ios:pt-8 android:pt-4' data={supportedCurrencies} renderItem={drawCurrencyItem} keyExtractor={(item) => item.symbol} showsVerticalScrollIndicator={false} />
    </CustomSafeAreaView>
  )

}
