/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { SafeAreaView, View, Text, FlatList, ActivityIndicator } from 'react-native';
import Collapsible from 'react-native-collapsible';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import WalletTransaction from 'components/Wallet/Transaction';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* utils */
import { emptyString, ellipsis } from 'utils/string';
import { numberFormat } from 'utils/number';
import { satsToBtc } from 'utils/blockchain';

export default function WalletTransactions({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { wallet, transactions } = useWallet();

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('WalletTransactions.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* ui */
  const drawTransaction = ({ item: transaction }) => {
    return <WalletTransaction transaction={transaction} />
  }

  const drawEmpty = () => {
    return (
      <View className='w-full items-center px-4 my-16'>
        <Text className='font-gilroy text-dark-gray text-base text-center'>{localize('WalletTransactions.EmptyText')}</Text>
      </View>
    )
  }

  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <FlatList className='w-full' data={transactions} renderItem={drawTransaction} ListEmptyComponent={drawEmpty} keyExtractor={(item) => item.txid} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false} />
    </CustomSafeAreaView>
  )

}
