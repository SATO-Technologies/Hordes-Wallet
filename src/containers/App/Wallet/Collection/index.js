/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Collapsible from 'react-native-collapsible';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import { Inscription } from 'components/Inscription/List';
import InscriptionPreview from 'components/Inscription/Preview';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useModals } from 'contexts/modals';

/* managers */
import ordinalsApi from 'managers/ordinals';

/* utils */
import { emptyString, ellipsis } from 'utils/string';
import { numberFormat } from 'utils/number';
import { satsToBtc } from 'utils/blockchain';
import { sortInscriptions } from 'utils/ordinals';

/* assets */
import ArrowLogo from 'assets/svgs/arrow.svg';

export default function WalletCollection({ navigation, route: { params: { collection: collectionParam }} }) {

  /* localization */
  const { localize } = useLocalization();

  /* states */
  const [showCollection, setShowCollection] = useState(true);
  const [collection, setCollection] = useState(collectionParam);
  const [inscriptions, setInscriptions] = useState([]);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{collection.slug}</Text>,
      headerLargeTitle: false
    });

  }, []);

  useEffect(() => {

    const doAsyncRequest = async () => {

      if( !collection.lowest_inscription_num ) {
        let range = await ordinalsApi.collection.getRange({ slug: collection.slug });
        if( range && range.lowest_inscription_num ) {
          setCollection({ ...collection, ...range });
        }
      }

      let collectionInscriptions = await ordinalsApi.collection.getInscriptions({ slug: collection.slug, numberOfInscriptions: collection.total_supply });
      if( collectionInscriptions ) {
        collectionInscriptions = sortInscriptions(collectionInscriptions);
        let groups = [];
        for( let i = 0; i < collectionInscriptions.length; i += 2 ) {
          groups.push([collectionInscriptions[i], collectionInscriptions[i + 1]]);
        }
        setInscriptions(groups);
      }
    }
    doAsyncRequest();

  }, [])

  /* ui */
  const drawHeader = () => {
    return (
      <View className='w-full bg-light-gray border border-light-gray rounded-lg overflow-hidden mt-4'>
        <View className='w-full flex-row items-center px-4 py-2'>
          <View className='flex-1'>
            <Text className='font-gilroy-bold text-dark-gray text-lg'>{collection.name}</Text>
          </View>
          <Button className='w-8 h-10 items-end justify-center' onPress={() => setShowCollection(!showCollection)}>
            <View className='w-5 h-5'><ArrowLogo style={{ transform: [{ rotate: showCollection ? '90deg' : '-90deg' }] }} /></View>
          </Button>
        </View>
        <Collapsible className='w-full' collapsed={showCollection == false}>
          <View className='w-full bg-white p-4'>
            <Text className='font-gilroy text-black text-sm'>{collection.description}</Text>
            <View className='w-full flex-row mt-4 border-t border-t-light-gray pt-4'>
              <View className='flex-[0.35]'>
                <Text className='font-gilroy text-black text-sm'>{localize('Collection.SupplyText')}</Text>
                <Text className='font-gilroy-bold text-black text-sm'>{numberFormat(collection.total_supply)}</Text>
              </View>
              <View className='flex-[0.65]'>
                <Text className='font-gilroy text-black text-sm'>{localize('Collection.RangeText')}</Text>
                <Text className='font-gilroy-bold text-black text-sm'>#{numberFormat(collection.lowest_inscription_num)} - #{numberFormat(collection.highest_inscription_num)}</Text>
              </View>
            </View>
          </View>
        </Collapsible>
      </View>
    )
  }

  const drawInscriptions = ({ item: inscriptions }) => {
    return (
      <View className='w-full flex-row flex-wrap justify-between mt-4'>
        <View className='w-[48%]'>
          <Inscription inscription={inscriptions[0]} />
        </View>
        <View className='w-[48%]'>
          {inscriptions[1] ? <Inscription inscription={inscriptions[1]} /> : null}
        </View>
      </View>
    )
  }

  const drawEmpty = () => {
    return (
      <View className='w-full items-center my-8'>
        <ActivityIndicator size='large' color='#303030' />
      </View>
    )
  }

  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <View className='w-full px-4'>
        <FlatList className='w-full' data={inscriptions} renderItem={drawInscriptions} ListEmptyComponent={drawEmpty} ListHeaderComponent={drawHeader} keyExtractor={(item) => item[0].id} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false} />
      </View>
    </CustomSafeAreaView>
  )

}
