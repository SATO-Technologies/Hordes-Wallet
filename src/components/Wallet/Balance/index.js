/**
 * AmountValue
 */

import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text
} from 'react-native';

/* components */
import Button from 'components/Button';

/* contexts */
import { useAccount } from 'contexts/account';
import { useCurrencies } from 'contexts/currencies';

/* utils */
import { numberFormat } from 'utils/number';
import { satsToBtc } from 'utils/blockchain';

/* assets */
import BitcoinLogo from 'assets/svgs/btc.svg';
import SatsLogo from 'assets/svgs/sats.svg';

export default function WalletBalance({ value, unconfirmed = 0, style = [] }) {

  /* account context */
  const { account: { currencies: { fiat }, hideBalance } } = useAccount();

  /* currencies context */
  const { btcPrice, currencies } = useCurrencies();

  /* states */
  const [currencyIndex, setCurrencyIndex] = useState(0);

  /* screen states */
  useEffect(() => {
    setCurrencyIndex(0)
  }, [value]);

  /* data */
  const textForIndex = (index, showUnconfirmed = false) => {
    switch (index) {
      case 0:
        return (
          <View className='flex-row items-center justify-center'>
            <Text className='font-gilroy text-black text-5xl'>{hideBalance ? '*****' : numberFormat(value)}</Text>
          </View>
        )
      case 1:
        return (
          <View className='flex-row items-center justify-center'>
            <Text className='font-gilroy text-black text-5xl'>{hideBalance ? '*****' : numberFormat(satsToBtc(value))}</Text>
          </View>
        )
      case 2:
        return (
          <View className='flex-row items-center'>
            <Text className='font-gilroy text-dark-gray text-base'>{hideBalance ? '*****' : `${fiat} ${numberFormat(satsToBtc(value) * btcPrice * currencies[fiat], 3)}`}</Text>
            <Text className='font-gilroy text-dark-gray text-base ml-1'>{currencies.fiat}</Text>
          </View>
        )
    }
  }

  /* actions */
  const onPress = () => {
    setCurrencyIndex(currencyIndex >= 1 ? 0 : (currencyIndex+1));
  }

  /* ui */
  return (
    <Button className='items-center justify-center' delay={50} onPress={onPress}>
      <View className='w-8 h-8 mb-4'>{currencyIndex == 0 ? <SatsLogo /> : currencyIndex == 1 ? <BitcoinLogo /> : null}</View>
      {textForIndex(currencyIndex, false)}
      {textForIndex(2, true)}
      {unconfirmed > 0
        ?
          <View className='flex-row items-center mt-4'>
            <Text className='font-gilroy text-orange text-base'>Incoming <Text className='font-gilroy text-black'>{numberFormat(satsToBtc(unconfirmed))} BTC</Text></Text>
          </View>
        :
          null
      }
    </Button>
  )
}
