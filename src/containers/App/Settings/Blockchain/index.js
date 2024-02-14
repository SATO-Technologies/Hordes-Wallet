/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput } from 'react-native';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';

export default function SettingsBlockchain({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { account, updateAccount } = useAccount();

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Settings.BlockchainHeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* ui */
  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <View className='w-full mt-8 px-4'>
        <Text className='font-gilroy-bold text-black text-base'>{localize('Settings.BlockchainElectrumUrlText')}</Text>
        <View className='w-full h-12 flex-row items-center border border-light-gray rounded-lg pl-4 pr-2 mt-2'>
          <Text className='font-gilroy text-sm'>ssl://electrum.blockstream.info:60002</Text>
        </View>
        <Text className='font-gilroy-bold text-black text-base mt-4'>{localize('Settings.BlockchainNetworkText')}</Text>
        <View className='w-full h-12 flex-row items-center border border-light-gray rounded-lg pl-4 pr-2 mt-2'>
          <Text className='font-gilroy text-sm'>MainNet</Text>
        </View>
      </View>
    </CustomSafeAreaView>
  )

}
