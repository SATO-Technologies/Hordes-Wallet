/* modules */
import { Fragment, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, Alert, ActivityIndicator, Linking } from 'react-native';
import FastImage from 'react-native-fast-image';
import PageControl from 'react-native-page-control';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import { Inscription } from 'components/Inscription/List';
import GiftsShare from 'components/Profile/Share';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* managers */
import hordesApi from 'managers/hordes';
import ordinalsApi from 'managers/ordinals';

/* utils */
import { ellipsis } from 'utils/string';

/* assets */
import ArrowLogo from 'assets/svgs/arrow.svg';
import ShareLogo from 'assets/svgs/shareWhite.svg';
import TwitterLogo from 'assets/svgs/socials/twitter.svg';

export default function Settings({ navigation }) {

  /* refs */
  const shareRef = useRef(null);

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { address, inscriptions } = useWallet();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [page, setPage] = useState(0);
  const [collections, setCollections] = useState([]);
  const [inscriptionsGiven, setInscriptionsGiven] = useState(null);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-white text-base uppercase tracking-widest'>{localize('Gifts.HeaderText')}</Text>,
      headerLargeTitle: false,
      headerStyle: {
        backgroundColor: '#303030',
      }
    });

  }, []);

  useEffect(() => {

    const doAsyncRequest = async () => {
      let slugs = await hordesApi.collections.get();
      if( slugs && slugs.length > 0 ) {
        let collectionsByHordes = []
        for( const slug of slugs ) {
          let coll = await ordinalsApi.collection.get({ slug: slug });
          if( coll ) {
            collectionsByHordes.push(coll);
          }
        }
        setCollections(collectionsByHordes);
      }

      let gifstGiven = await hordesApi.gifts.get();
      if( gifstGiven && gifstGiven.length > 0 ) {
        setInscriptionsGiven(gifstGiven);
      } else {
        setInscriptionsGiven([]);
      }
    }
    doAsyncRequest();

  }, []);

  /* actions */
  const onScroll = (event) => {
    setPage(parseInt(event.nativeEvent.contentOffset.x / Dimensions.get('window').width));
  }

  const onShareButtonPress = async () => {
    let uri = await shareRef.current?.capture();
    if( uri ) {
      Share.shareSingle({
        message: localize('Share.GiftsMessageText', [address.ordinals]),
        url: uri,
        social: Share.Social.TWITTER
      }).then(() => {}).catch(() => {});
    }
  }

  const onInscriptionButtonPress = async (inscription) => {
    let inscriptionFound = inscriptions.find((i) => i.id == inscription.id);
    if( !inscriptionFound ) {
      showModal('LOADER');
      inscriptionFound = await ordinalsApi.inscription.get({ id: inscription.id });
      hideModal('LOADER');
    }
    if( inscriptionFound ) {
      navigation.push('Inscription', { inscription: inscriptionFound });
    } else {
      navigation.push('Inscription', { inscription: inscription });
    }
  }

  /* ui */
  return (
    <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white' insets={[]}>
      <ScrollView className='w-full h-full' contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View className='w-full h-[1000] bg-black -mt-[1000]' />
        <View className={`w-full h-[400] bg-black rounded-b-3xl overflow-hidden`}>
          <View className='w-full items-center my-4'>
            <Text className='font-gilroy text-white text-2xl'>{localize('Gifts.CollectionsText')}</Text>
            <Text className='font-gilroy-bold text-orange text-lg'>{localize('Gifts.BySatoText')}</Text>
          </View>
          <ScrollView className='w-full flex-1' pagingEnabled={true} horizontal={true} showsHorizontalScrollIndicator={false} scrollEventThrottle={5} onMomentumScrollEnd={onScroll}>
            {collections.length == 0
              ?
                <View className='flex-1 items-center justify-center' style={{ width: Dimensions.get('window').width }}>
                  <ActivityIndicator size='large' color='white' />
                </View>
              :
                collections.map((collection, index) => {
                  return (
                    <Button key={index} className='flex-1 items-center justify-center pt-4 pb-8' style={{ width: Dimensions.get('window').width }} onPress={() => navigation.push('Collection', { collection: collection })}>
                      <View className='flex-1 aspect-square rounded-lg overflow-hidden'>
                        <FastImage resizeMode={FastImage.resizeMode.cover} source={{ uri: collection.icon }} style={{ width: '100%', height: '100%' }} />
                      </View>
                      <Text className='font-gilroy text-white text-lg mt-2'>{collection.name}</Text>
                    </Button>
                  )
                })
            }
          </ScrollView>
          <View className='absolute w-full bottom-0 h-8 items-center justify-center'>
            <PageControl numberOfPages={collections.length} currentPage={page} currentPageIndicatorTintColor='#ffffff' pageIndicatorTintColor='#bebebe' />
          </View>
        </View>
        <View className='w-full items-center mt-8 px-4'>
          <Text className='font-gilroy text-dark-gray text-base text-center'>{localize('Gifts.OrdinalsAddressShareText1')} <Text className='font-gilroy-bold text-black'>{localize('Gifts.OrdinalsAddressShareText2')}</Text> {localize('Gifts.OrdinalsAddressShareText3')}</Text>
          <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-4' onPress={onShareButtonPress}>
            <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('Gifts.ShareText')}</Text>
            <View className='absolute right-4 w-5 h-5 items-center justify-center'><ShareLogo /></View>
          </Button>
        </View>
        <View className='w-full mt-12'>
          <View className='w-full items-center border-b border-b-light-gray pb-4'>
            <Text className='font-gilroy text-dark-gray text-xl text-center'>{localize('Gifts.OrdinalsGivenText')}</Text>
          </View>
        </View>
        <View className='w-full px-4'>
          {inscriptionsGiven == null
            ?
              <View className='w-full items-center mt-4'>
                <ActivityIndicator size='large' color='#303030' />
              </View>
            :
              inscriptionsGiven.length == 0
                ?
                  <View className='w-full mt-4'>
                    <View className='w-full items-center justify-center aspect-[16/9] bg-light-gray rounded-lg px-16'>
                      <Text className='font-gilroy text-black text-base'>{localize('Gifts.OrdinalsGivenEmptyText1')}</Text>
                      <Text className='font-gilroy-bold text-black text-base'>{localize('Gifts.OrdinalsGivenEmptyText2')}</Text>
                      <Text className='font-gilroy text-black text-base'>{localize('Gifts.OrdinalsGivenEmptyText3')}</Text>
                    </View>
                  </View>
                :
                  inscriptionsGiven.map((gift, index) => {
                    return (
                      <View key={index} className='w-full flex-row pt-4 border-b border-b-light-gray'>
                        <View className='flex-1'>
                          <Inscription inscription={gift.inscription} onPress={onInscriptionButtonPress} />
                        </View>
                        <View className='w-4' />
                        <View className='flex-1 mb-4'>
                          <View className='w-full flex-1 items-center justify-center'>
                            <Text className='font-gilroy-bold text-black text-base text-center'>{gift.name}</Text>
                            <Button onPress={() => navigation.push('Profile', { address: gift.address })}><Text className='font-gilroy text-dark-gray text-sm underline'>{localize('Gifts.SeeProfileText')}</Text></Button>
                          </View>
                          <View className='w-full items-center'>
                            <Button onPress={() => Linking.openURL(`https://mempool.space/tx/${gift.txid}`)}><Text className='font-gilroy text-dark-gray text-sm underline'>{localize('Gifts.SeeTransactionText')}</Text></Button>
                          </View>
                        </View>
                      </View>
                    )
                  })
          }
        </View>
        <ViewShot ref={shareRef} options={{ format: 'png', quality: 1 }} className='absolute w-[100%] h-auto -top-[10000]'>
          <GiftsShare />
        </ViewShot>
      </ScrollView>
    </CustomSafeAreaView>
  )

}
