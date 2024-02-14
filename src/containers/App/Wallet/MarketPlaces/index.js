/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useModals } from 'contexts/modals';

/* managers */
import ordinalsApi from 'managers/ordinals';

/* utils */
import { emptyString, ellipsis } from 'utils/string';
import { numberFormat } from 'utils/number';

/* assets */
import ArrowLogo from 'assets/svgs/arrow.svg';
import MagicEdenImage from 'assets/images/marketplaces/magiceden.jpg';
import OrdinalsWalletImage from 'assets/images/marketplaces/ordinalswallet.jpg';
import OrdioImage from 'assets/images/marketplaces/ordio.jpg';
import OrdinalsHubImage from 'assets/images/marketplaces/ordinalhub.jpg';
import OrdinalsImage from 'assets/images/marketplaces/ordinals.jpg';
import GammaioImage from 'assets/images/marketplaces/gammaio.jpg';
import ScarceImage from 'assets/images/marketplaces/scare.jpg';
import OrdinalsmarketImage from 'assets/images/marketplaces/ordinalsmarket.jpg';
import OrdinalshiroImage from 'assets/images/marketplaces/ordinalshiro.jpg';
import OrdzaarImage from 'assets/images/marketplaces/ordzaar.jpg';
import HordesImage from 'assets/images/marketplaces/hordes.jpg';
import GoogleImage from 'assets/images/marketplaces/google.jpg';

export default function WalletMarketPlaces({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* states */
  const [data, setData] = useState([
    [{ title: 'MagicEden', url: 'https://magiceden.io', icon: MagicEdenImage }, { title: 'OrdinalsWallet', url: 'https://ordinalswallet.com', icon: OrdinalsWalletImage }],
    [{ title: 'Ord.io', url: 'https://www.ord.io', icon: OrdioImage }, { title: 'OrdinalsHub', url: 'https://www.ordinalhub.com', icon: OrdinalsHubImage }],
    [{ title: 'Ordinals', url: 'https://ordinals.com', icon: OrdinalsImage }, { title: 'Gamma.io', url: 'https://gamma.io', icon: GammaioImage }],
    [{ title: 'Scarce', url: 'https://scarce.city', icon: ScarceImage }, { title: 'Ordinals.market', url: 'https://ordinals.market', icon: OrdinalsmarketImage }],
    [{ title: 'Ordinals.hiro', url: 'https://ordinals.hiro.so', icon: OrdinalshiroImage }, { title: 'Ordzaar', url: 'https://ordzaar.com', icon: OrdzaarImage }],
    [{ title: 'Hordes Inscribe', url: 'https://inscribe.bysato.com', icon: HordesImage }, { title: 'Google Search', url: 'https://www.google.com', icon: GoogleImage }]
  ]);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('WalletMarketPlaces.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* ui */
  const drawMarkets = ({ item: market }) => {
    if( !market ) return null;
    return (
      <View className='w-full flex-row flex-wrap justify-between mt-4'>
        <Button className='w-[48%] p-4 border border-light-gray rounded-lg' onPress={() => navigation.push('Browser', { title: market[0].title, url: market[0].url })}>
          <View className='w-full items-center'>
            <FastImage resizeMode={FastImage.resizeMode.cover} source={market[0].icon} className='w-[50%] aspect-square rounded-lg' />
            <Text className='font-gilroy-bold text-black text-sm mt-2'>{market[0].title}</Text>
          </View>
        </Button>
        {market[1] ? <Button className='w-[48%] p-4 border border-light-gray rounded-lg' onPress={() => navigation.push('Browser', { title: market[1].title, url: market[1].url })}>
          <View className='w-full items-center'>
            <FastImage resizeMode={FastImage.resizeMode.cover} source={market[1].icon} className='w-[50%] aspect-square rounded-lg' />
            <Text className='font-gilroy-bold text-black text-sm mt-2'>{market[1].title}</Text>
          </View>
        </Button>: null}
      </View>
    )
  }

  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <View className='w-full px-4'>
        <FlatList className='w-full' data={data} renderItem={drawMarkets} keyExtractor={(item) => item[0].url} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false} />
      </View>
    </CustomSafeAreaView>
  )

}
