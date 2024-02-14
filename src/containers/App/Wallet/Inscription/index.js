/* modules */
import { Fragment, useState, useEffect, useLayoutEffect, useRef, createElement } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import Collapsible from 'react-native-collapsible';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import moment from 'moment';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button'
import InscriptionPreview from 'components/Inscription/Preview';
import InscriptionShare from 'components/Inscription/Share';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* managers */
import ordinalsApi from 'managers/ordinals';

/* utils */
import { numberFormat } from 'utils/number';
import { validUrl } from 'utils/string';
import satributes from 'utils/satributes';

/* assets */
import TransferLogo from 'assets/svgs/transfer.svg';
import ShareLogo from 'assets/svgs/share.svg';
import ArrowLogo from 'assets/svgs/arrow.svg';

export default function Inscription({ navigation, route: { params: { inscription: inscriptionParam, comesFromCollection = false } } }) {

  /* refs */
  const shareRef = useRef(null);

  /* localization */
  const { localize } = useLocalization();

  /* variables */
  const details = {
    id: { title: localize('Inscription.IDText') },
    num: { title: localize('Inscription.NumberText'), type: 'number' },
    owner: { title: localize('Inscription.OwnerText') },
    content_length: { title: localize('Inscription.ContentLengthText'), type: 'number' },
    content_type: { title: localize('Inscription.ContentTypeText') },
    created: { title: localize('Inscription.CreatedAtText'), type: 'date' },
    output: { title: localize('Inscription.LocationText') },
    genesis_height: { title: localize('Inscription.GenesisHeightText'), type: 'number' },
    genesis_fee: { title: localize('Inscription.GenesisFeeText'), type: 'number' },
    sat_offset: { title: localize('Inscription.SatOffsetText'), type: 'number' }
  }

  /* wallet context */
  const { wallet, sync, address } = useWallet();

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [inscription, setInscription] = useState(inscriptionParam);
  const [showCollection, setShowCollection] = useState(true);
  const [showSatributes, setShowSatributes] = useState(true);
  const [showAttributes, setShowAttributes] = useState(true);
  const [showDetails, setShowDetais] = useState(true);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Inscription.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  useEffect(() => {

    const doAsyncRequest = async () => {
      let inscriptionUpdated = { ...inscriptionParam }
      if( inscriptionUpdated ) {
        if( !inscriptionUpdated.satributes ) inscriptionUpdated.satributes = [];

        if( inscriptionUpdated.collection?.slug == 'hordes' && !inscriptionUpdated.satributes.includes('sato_sats') ) {
          inscriptionUpdated.satributes.splice(0, 0, 'sato_sats');
        }

        if( inscriptionUpdated.collection?.slug && !inscriptionUpdated.collection.total_supply ) {
          let collection = await ordinalsApi.collection.get({ slug: inscriptionUpdated.collection.slug });
          inscriptionUpdated = { ...inscriptionUpdated, collection: collection };
        }

        if( inscriptionUpdated.collection?.slug && !inscriptionUpdated.collection.lowest_inscription_num ) {
          let range = await ordinalsApi.collection.getRange({ slug: inscriptionUpdated.collection.slug });
          if( range && range.lowest_inscription_num ) {
            inscriptionUpdated.collection = { ...inscriptionUpdated.collection, ...range };
          }
        }

        if( !inscriptionUpdated.owner ) {
          let outpoint = await ordinalsApi.inscription.getOutpoint({ id: inscriptionUpdated.id });
          if( outpoint && outpoint.owner ) {
            inscriptionUpdated = { ...inscriptionUpdated, ...outpoint };
          }
        }
        setInscription(inscriptionUpdated);
      }
    }
    doAsyncRequest();

  }, []);

  /* actions */
  const onTransferInscriptionButtonPress = () => {
    if( inscription.txid == null || inscription.vout == null || inscription.outputValue == null || inscription.sat_offset == null ) {
      Alert.alert('Hordes', `Missing information for inscription ${inscription.id}, wait for wallet sync`);
    } else {
      showModal('INSCRIPTION_TRANSFER', {
        inscription: inscription,
        onClose: async () => {
          await sync({ id: wallet.id });
        }
      });
    }
  }

  const onShareButtonPress = async () => {
    let uri = await shareRef.current?.capture();
    if( uri ) {
      Share.open({
        message: localize('Share.InscriptionMessageText', [inscription.id]),
        url: uri
      }).then(() => {}).catch(() => {});
    }
  }

  /* ui */
  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <ScrollView className='w-full flex-1 px-4' contentContainerStyle={{ paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        <View className='w-full bg-light-gray rounded-lg overflow-hidden'>
          <View className='w-full aspect-square rounded-lg overflow-hidden'>
            <InscriptionPreview key={`wallet-inscription-${inscription.id}`} inscriptionId={inscription.id} type={inscription.content_type} resizeMode='contain' textSize='text-lg' preview={false} />
          </View>
        </View>
        <View className='w-full items-center px-4 py-2'>
          <Text className='font-gilroy text-black text-lg'>{inscription.meta?.name || `${localize('Inscription.TitleText', [numberFormat(inscription.num)])}`}</Text>
          {inscription.meta?.name ? <Text className='font-gilroy text-black text-sm'>{localize('Inscription.TitleText', [numberFormat(inscription.num)])}</Text> : null}
        </View>
        <View className='w-full flex-row mt-4'>
          <Button className='flex-1 h-10 items-center justify-center bg-black rounded-lg' onPress={onShareButtonPress}>
            <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('Inscription.ShareText')}</Text>
          </Button>
          <View className='w-4' />
          <Button className={`flex-1 h-10 items-center justify-center ${inscription.owner == address.ordinals ? 'bg-black' : 'bg-light-gray'} rounded-lg`} onPress={inscription.owner == address.ordinals ? onTransferInscriptionButtonPress : null}>
            {inscription.owner == null
              ?
                <ActivityIndicator />
              :
                <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>Transfer</Text>
            }
          </Button>
        </View>
        {inscription.collection && inscription.collection.total_supply ? <View className='w-full bg-light-gray border border-light-gray rounded-lg overflow-hidden mt-4'>
          <View className='w-full flex-row items-center px-4'>
            <View className='flex-1'>
              <Button onPress={comesFromCollection ? null : () => navigation.push('Collection', { collection: inscription.collection })}><Text className='font-gilroy-bold text-dark-gray text-base'>{inscription.collection.name}</Text></Button>
            </View>
            <Button className='w-12 h-12 items-end justify-center' onPress={() => setShowCollection(!showCollection)}>
              <View className='w-5 h-5'><ArrowLogo style={{ transform: [{ rotate: showCollection ? '90deg' : '-90deg' }] }} /></View>
            </Button>
          </View>
          <Collapsible className='w-full' collapsed={showCollection == false}>
            <View className='w-full bg-white'>
              <View className='w-full flex-row p-4'>
                <View className='flex-[0.35]'>
                  <Text className='font-gilroy text-black text-sm'>{localize('Collection.SupplyText')}</Text>
                  <Text className='font-gilroy-bold text-black text-sm'>{numberFormat(inscription.collection.total_supply)}</Text>
                </View>
                <View className='flex-[0.65]'>
                  <Text className='font-gilroy text-black text-sm'>{localize('Collection.RangeText')}</Text>
                  {inscription.collection.lowest_inscription_num ? <Text className='font-gilroy-bold text-black text-sm'>#{numberFormat(inscription.collection.lowest_inscription_num)} - #{numberFormat(inscription.collection.highest_inscription_num)}</Text> : null}
                </View>
              </View>
              {comesFromCollection ? null : <View className='w-full items-center'>
                <Button className='p-4' onPress={() => navigation.push('Collection', { collection: inscription.collection })}><Text className='font-gilroy text-black text-sm underline'>{localize('Collection.SeeFullText')}</Text></Button>
              </View>}
            </View>
          </Collapsible>
        </View> : null}
        <View className='w-full bg-light-gray border border-light-gray rounded-lg overflow-hidden mt-4'>
          <View className='w-full flex-row items-center px-4'>
            <Text className='font-gilroy-bold text-dark-gray text-base'>{localize('Satributes.TitleText')}</Text>
            <View className='flex-1 items-end'>
              <Button className='w-12 h-12 items-end justify-center' onPress={() => setShowSatributes(!showSatributes)}>
                <View className='w-5 h-5'><ArrowLogo style={{ transform: [{ rotate: showSatributes ? '90deg' : '-90deg' }] }} /></View>
              </Button>
            </View>
          </View>
          <Collapsible className='w-full' collapsed={showSatributes == false}>
            {inscription.satributes?.length > 0
              ?
                <View className='w-full bg-white'>
                  {inscription.satributes.map((satribute, index) => {
                    if( !satributes[satribute] ) return null;
                    return (
                      <View key={index} className='w-full flex-row p-4'>
                        <View className='w-8 h-8'>{createElement(satributes[satribute].icon)}</View>
                        <View className='flex-1 ml-4'>
                          <Text className='font-gilroy-bold text-black text-sm'>{localize(satributes[satribute].title)}</Text>
                          <Text className='font-gilroy text-black text-sm'>{localize(satributes[satribute].desc)}</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              :
                <View className='w-full bg-white p-4'>
                  <Text className='font-gilroy text-black text-base'>{localize('Satributes.EmptyText')}</Text>
                </View>
            }
          </Collapsible>
        </View>
        {inscription.meta?.attributes ? <View className='w-full bg-light-gray border border-light-gray rounded-lg overflow-hidden mt-4'>
          <View className='w-full flex-row items-center px-4'>
            <Text className='font-gilroy-bold text-dark-gray text-bse'>{localize('Inscription.Attributes')}</Text>
            <View className='flex-1 items-end'>
              <Button className='w-12 h-12 items-end justify-center' onPress={() => setShowAttributes(!showAttributes)}>
                <View className='w-5 h-5'><ArrowLogo style={{ transform: [{ rotate: showAttributes ? '90deg' : '-90deg' }] }} /></View>
              </Button>
            </View>
          </View>
          <Collapsible className='w-full' collapsed={showAttributes == false}>
            <View className='w-full flex-row flex-wrap bg-white px-4 pt-2 pb-4'>
              {inscription.meta.attributes.map((attribute, index) => {
                let isUrl = validUrl(attribute.value);
                return (
                  <View key={index} className={`${isUrl ? 'w-full flex-row items-center justify-between' : attribute.value.length > 50 ? 'w-full' : 'w-[50%]'} mt-2`}>
                    <Text className='font-gilroy text-black text-sm'>{attribute.trait_type}</Text>
                    {isUrl
                      ?
                        <Button className='px-4 py-1 rounded-full border border-light-gray' onPress={() => Linking.openURL(attribute.value)}><Text className='font-gilroy text-black text-xs'>Open</Text></Button>
                      :
                        <Text className='font-gilroy-bold text-dark-gray text-sm'>{attribute.value}</Text>
                    }
                  </View>
                )
              })}
            </View>
          </Collapsible>
        </View> : null}
        <View className='w-full bg-light-gray border border-light-gray rounded-lg overflow-hidden mt-4'>
          <View className='w-full flex-row items-center px-4'>
            <Text className='font-gilroy-bold text-dark-gray text-base'>{localize('Inscription.DetailsText')}</Text>
            <View className='flex-1 items-end'>
              <Button className='w-12 h-12 items-end justify-center' onPress={() => setShowDetais(!showDetails)}>
                <View className='w-5 h-5'><ArrowLogo style={{ transform: [{ rotate: showDetails ? '90deg' : '-90deg' }] }} /></View>
              </Button>
            </View>
          </View>
          <Collapsible className='w-full' collapsed={showDetails == false}>
            <View className='w-full px-4 pt-2 pb-4 bg-white'>
              {Object.keys(details).map((key, index) => {
                if( inscription[key] == null ) return null;
                return (
                  <View key={index} className='w-full mt-2'>
                    <Text className='font-gilroy text-black text-sm'>{details[key].title}</Text>
                    <Text className='font-gilroy-bold text-dark-gray text-sm' selectable={true}>{details[key].type == 'number' ? numberFormat(inscription[key]) : details[key].type == 'date' ? moment(inscription[key] * 1000).format('MM/DD/YYYY HH:mm:ss') : inscription[key]}</Text>
                  </View>
                )
              })}
            </View>
          </Collapsible>
        </View>
        <ViewShot ref={shareRef} options={{ format: 'png', quality: 1 }} className='absolute w-[175%] h-auto -top-[10000]'>
          <InscriptionShare inscription={inscription} />
        </ViewShot>
      </ScrollView>
    </CustomSafeAreaView>
  )

}
