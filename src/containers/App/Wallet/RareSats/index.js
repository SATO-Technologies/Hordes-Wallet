/* modules */
import { Fragment, useState, useEffect, useLayoutEffect, useRef, createElement } from 'react';
import { SafeAreaView, View, Text, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { validate as validBitcoinAddress } from 'bitcoin-address-validation';
import JSONbig from 'json-bigint';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import Balance from 'components/Wallet/Balance';
import SyncStatus from 'components/Wallet/SyncStatus';
import InscriptionsList from 'components/Inscription/List';

/* contexts */
import { useLocalization } from 'contexts/localization';

/* managers */
import hordesApi from 'managers/hordes';
import mempoolApi from 'managers/mempool';

/* libs */
import { findFromKnownRanges as findRareSats } from 'libs/raresats/commands/find';

/* utils */
import { numberFormat } from 'utils/number';
import { emptyString } from 'utils/string';
import satributes, { parseSatribute } from 'utils/satributes';

/* assets */
import SearchLogo from 'assets/svgs/glass.svg';

const JSONbigNative = JSONbig({ useNativeBigInt: true, alwaysParseAsBig: true });

export default function WalletRareSats({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* states */
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState('');
  const [raresats, setRaresats] = useState(null);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('WalletRareSats.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* actions */
  const onSearchButtonPress = async () => {
    if( emptyString(address) || !validBitcoinAddress(address) ) return;

    setProcessing(true);

    let utxos = await mempoolApi.listUnspent({ address: address });
    if( utxos && utxos.length > 0 ) {
      let outpoints = [];
      let utxosValues = {};
      utxos.forEach((utxo) => {
        outpoints.push(`${utxo.txid}:${utxo.vout}`);
        utxosValues[`${utxo.txid}:${utxo.vout}`] = utxo.value;
      });
      let outpointToRanges = await hordesApi.raresats.search({ outpoints: outpoints });
      if( outpointToRanges ) outpointToRanges = JSONbigNative.parse(outpointToRanges);
      let raresatsInOutpoints = await findRareSats({ utxos: outpoints.filter((o) => Object.keys(outpointToRanges).includes(o)), outpointToRanges: outpointToRanges, utxosValues: utxosValues });
      if( raresatsInOutpoints && raresatsInOutpoints.success == true && raresatsInOutpoints.result['utxos'] ) {
        let raresatsFound = {};
        Object.keys(raresatsInOutpoints.result['utxos']).map((outpoint) => {
          Object.keys(raresatsInOutpoints.result['utxos'][outpoint].count).map((name) => {
            let parsedSat = parseSatribute(name);
            if( !raresatsFound[parsedSat] ) raresatsFound[parsedSat] = { count: BigInt(0), sats: 0 }
            raresatsFound[parsedSat].count += raresatsInOutpoints.result['utxos'][outpoint].count[name];
            // raresatsFound[parsedSat].sats += raresatsInOutpoints.result['utxos'][outpoint].utxoValue;
          });
        });
        setRaresats(raresatsFound);
        setProcessing(false);
        return;
      }
    }
    setRaresats({ });
    setProcessing(false);
  }

  /* ui */
  const buildSatributesGroup = () => {
    let groups = [];
    let raresatsAsArray = []
    Object.keys(raresats).map((satribute, index) => {
      raresatsAsArray.push({
        satribute: satribute,
        ...raresats[satribute]
      })
    });
    raresatsAsArray = raresatsAsArray.filter((rs) => satributes[rs.satribute]);
    for( let i = 0; i < raresatsAsArray.length; i += 2 ) {
      groups.push([raresatsAsArray[i], raresatsAsArray[i + 1]]);
    }
    return groups;
  }

  const drawSatribute = (raresats) => {
    return (
      <Button className='w-full items-center'>
        <View className='w-full items-center border border-light-gray rounded-lg p-4'>
          <View className='w-12 h-12'>{createElement(satributes[raresats.satribute].icon)}</View>
          <Text numberOfLines={2} className='h-10 font-gilroy-bold text-black text-sm mt-3 text-center'>{localize(satributes[raresats.satribute].title)}</Text>
          <View className='p-2 items-center justify-center rounded-full bg-light-gray mt-1'>
            <Text className='font-gilroy text-black text-xs'>x{numberFormat(raresats.count)}</Text>
          </View>
        </View>
      </Button>
    )
  }

  return (
    <Fragment>
      <SafeAreaView className='flex-0 bg-white' />
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white' insets={[]}>
        <ScrollView className='w-full' contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false} removeClippedSubviews={true}>
          <View className='w-full px-4 mt-8'>
            <View className='w-full mb-8'>
              <Text className='font-gilroy text-dark-gray text-lg'>{localize('WalletRareSats.AddressText')}</Text>
              <View className='w-full justify-center rounded-lg mt-2'>
                <View className='w-full flex-row items-center border border-light-gray rounded-lg'>
                  <View className='flex-1 h-12 bg-white rounded-lg pl-4'>
                    <TextInput className='w-full h-full font-gilroy' value={address} onChangeText={setAddress} placeholder={localize('WalletRareSats.WriteHereText')} placeholderTextColor='#68717b' onBlur={onSearchButtonPress} />
                  </View>
                  {emptyString(address) ? null : <Button className='h-12 items-center justify-center bg-white rounded-lg px-4 ml-4' onPress={onSearchButtonPress}>
                    <View className='w-5'><SearchLogo /></View>
                  </Button>}
                </View>
                <View className='w-full mt-4'>
                  <Text className='font-gilroy text-dark-gray text-sm'>{localize('WalletRareSats.NoteText1')} <Text className='font-gilroy-bold'>{localize('WalletRareSats.NoteText2')}</Text> {localize('WalletRareSats.NoteText3')} <Text className='font-gilroy-bold'>{localize('WalletRareSats.NoteText4')}</Text> {localize('WalletRareSats.NoteText5')}</Text>
                </View>
              </View>
            </View>
            {processing
              ?
                <View className='w-full items-center'>
                  <ActivityIndicator size='large' color='#303030' />
                </View>
              :
                raresats == null
                  ?
                    null
                  :
                    Object.keys(raresats).length == 0
                      ?
                        <View className='w-full'>
                          <View className='w-full items-center justify-center aspect-[16/10] bg-light-gray rounded-lg px-16'>
                            <Text className='font-gilroy text-black text-base'>{localize('Wallet.RareSatsEmptyText1')}</Text>
                            <Text className='font-gilroy-bold text-black text-base'>{localize('Wallet.RareSatsEmptyText2')}</Text>
                            <Text className='font-gilroy text-black text-base'>{localize('Wallet.RareSatsEmptyText3')}</Text>
                          </View>
                        </View>
                      :
                        <View className='w-full'>
                          {buildSatributesGroup().map((group, index) => {
                            return (
                              <View key={index} className='w-full flex-row flex-wrap justify-between mt-4'>
                                <View className='w-[48%]'>
                                  {drawSatribute(group[0])}
                                </View>
                                <View className='w-[48%]'>
                                  {group[1] ? drawSatribute(group[1]) : null}
                                </View>
                              </View>
                            )
                          })}
                        </View>
            }
          </View>
        </ScrollView>
      </CustomSafeAreaView>
    </Fragment>
  );

}
