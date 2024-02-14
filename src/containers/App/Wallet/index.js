/* modules */
import { Fragment, useState, useEffect, useLayoutEffect, useRef, createElement } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, Linking, Alert, Platform, ScrollView, DeviceEventEmitter, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import moment from 'moment';
import Collapsible from 'react-native-collapsible';
import InscriptionPreview from 'components/Inscription/Preview';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import Balance from 'components/Wallet/Balance';
import SyncStatus from 'components/Wallet/SyncStatus';
import InscriptionsList from 'components/Inscription/List';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* managers */
import ordinalsApi from 'managers/ordinals';

/* utils */
import { numberFormat } from 'utils/number';
import { ellipsis } from 'utils/string';
import satributes from 'utils/satributes';

/* assets */
import ReceiveLogo from 'assets/svgs/receive.svg';
import SendLogo from 'assets/svgs/send.svg';
import ScanLogo from 'assets/svgs/scan.svg';
import ShowLogo from 'assets/svgs/show.svg';
import HideLogo from 'assets/svgs/hide.svg';
import ArrowLogo from 'assets/svgs/arrow.svg';
import TransactionsLogo from 'assets/svgs/transactions.svg';
import LockLogo from 'assets/svgs/lock.svg';
import UnlockLogo from 'assets/svgs/unlock.svg';
import AlertLogo from 'assets/svgs/alert.svg';
import BrowserLogo from 'assets/svgs/browser.svg';

function Collection({ slug, name, inscriptions }) {

  /* navigation */
  let navigation = useNavigation();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(true);

  /* actions */
  const onCollectionButtonPress = async () => {
    showModal('LOADER');
    let collection = await ordinalsApi.collection.get({ slug: slug });
    setTimeout(() => {
      navigation.push('Collection', { collection: collection });
    }, Platform.OS === 'ios' ? 0 : 500);
    hideModal('LOADER');
  }

  /* ui */
  return (
    <View className='w-full bg-light-gray border border-light-gray rounded-lg overflow-hidden mt-4'>
      <View className='w-full flex-row items-center px-4'>
        <View className='flex-1 items-start'>
          <Button onPress={onCollectionButtonPress}><Text className='font-gilroy-bold text-black text-base'>{name || ''}</Text></Button>
        </View>
        <Button className='w-12 h-12 items-end justify-center' onPress={() => setShow(!show)}>
          <View className='w-5 h-5'><ArrowLogo style={{ transform: [{ rotate: show ? '90deg' : '-90deg' }] }} /></View>
        </Button>
      </View>
      <Collapsible className='w-full' collapsed={show == false}>
        <View className='w-full bg-white px-4'>
          <InscriptionsList inscriptions={inscriptions} />
        </View>
      </Collapsible>
    </View>
  )

}

function Utxo({ key, utxo, onSelected }) {

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { inscriptions } = useWallet();

  /* states */
  const [selected, setSelected] = useState(false);

  /* actions */
  const onSelectUtxoButtonPress = () => {
    onSelected({ utxo: utxo, selected: !selected });
    setSelected(!selected);
  }

  /* ui */
  return (
    <View className='w-full mt-4'>
      <Button className={`w-full rounded-lg border ${selected ? 'border-black' : utxo.locked ? 'border-orange' : 'border-light-gray'} py-4`} onPress={onSelectUtxoButtonPress}>
        <View className='w-full flex-row flex-wrap items-start justify-start'>
          {utxo.inscriptionsIds?.map((inscriptionId, index) => {
            let inscription = inscriptions.find((i) => i.id == inscriptionId);
            return (
              <View className='w-[28%] mb-2 ml-[4%]' key={inscriptionId}>
                <View className='w-full aspect-square rounded-lg overflow-hidden'>
                  <InscriptionPreview key={`wallet-${inscriptionId}`} inscriptionId={inscriptionId} type={inscription?.content_type} textSize='text-xs' />
                </View>
                <View className='w-full h-6 items-center justify-center'><Text className='font-gilroy text-dark-gray text-sm'># {numberFormat(inscription?.num || 0)}</Text></View>
              </View>
            )
          })}
          {Object.keys(utxo.raresats || {}).map((satribute, index) => {
            return (
              <View className='w-[28%] mb-2 ml-[4%]' key={`${satribute}_${index}`}>
                <View className='w-full aspect-square'>
                  <View className='w-full h-full items-center justify-center bg-light-gray rounded-lg'>
                    <View className='w-10 h-10'>{createElement(satributes[satribute].icon)}</View>
                  </View>
                </View>
                <View className='w-full h-6 items-center justify-center'><Text className='font-gilroy text-dark-gray text-sm'>x {numberFormat(utxo.raresats[satribute])}</Text></View>
              </View>
            )
          })}
        </View>
        <View className={`w-full items-start justify-start flex-row ${utxo.inscriptionsIds?.length > 0 || Object.keys(utxo.raresats || {}).length > 0 ? 'border-t border-t-light-gray pt-4' : ''} px-4`}>
          <View className='flex-row items-center'>
            <Text className='font-gilroy-bold text-black text-sm'>UTXO</Text>
            <Text className='font-gilroy text-dark-gray text-sm ml-2'>{ellipsis(utxo.txid, 6)}:{utxo.vout}</Text>
          </View>
          <View className='w-[1] h-full bg-light-gray mx-4' />
          <View className='flex-row items-center'>
            <Text className='font-gilroy-bold text-black text-sm'>Value</Text>
            <Text className='font-gilroy text-dark-gray text-sm ml-2'>{numberFormat(utxo.value)} sats</Text>
          </View>
        </View>
      </Button>
    </View>
  )

}

export default function Wallet({ navigation }) {

  /* refs */
  const scrollRef = useRef(null);

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { account, updateAccount } = useAccount();

  /* wallet context */
  const { wallet, status, sync, address, balance, unconfirmedBalance, ordinalsBalance, raresatsBalance, inscriptions: allInscriptions, inscriptionsWithCollection, inscriptionsWithoutCollection, raresats, parsedUtxos, signPsbt } = useWallet();

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [filter, setFilter] = useState('INSCRIPTIONS'); // INSCRIPTIONS - RARE_SATS - UTXOS
  const [utxosSelected, setUtxosSelected] = useState([]);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Wallet.BalanceText')}</Text>,
      headerLargeTitle: false,
      headerLeft: Platform.OS === 'ios' ? () => <SyncStatus /> : null,
      headerRight: () => (
        <View className='flex-row items-center justify-start'>
          {Platform.OS === 'ios' ? null : <View className='mr-4'><SyncStatus /></View>}
          <Button className='w-8 h-8 items-center justify-center' onPress={() => navigation.push('MarketPlaces')}><View className='w-6 h-6'><BrowserLogo /></View></Button>
          {/*<Button className='w-8 h-8 items-center justify-center ml-2' onPress={() => updateAccount('hideBalance', !account.hideBalance)}>{account.hideBalance ? <HideLogo /> : <ShowLogo />}</Button>*/}
          <Button className='w-8 h-8 items-end justify-center ml-2' onPress={onTransactionsButtonPress}><View className='w-6 h-6'><TransactionsLogo /></View></Button>
        </View>
      )
    });

  }, [account]);

  useEffect(() => {
    const tabPressEvent = DeviceEventEmitter.addListener('WalletTabPress', () => {
      scrollRef.current?.scrollTo({ x: 0, y: 0 });
    });
    return () => {
      tabPressEvent.remove();
    }
  }, [navigation]);

  useEffect(() => {
    setUtxosSelected([])
  }, [filter]);

  useEffect(() => {

  }, []);

  /* actions */
  const onReceiveButtonPress = () => {
    showModal('WALLET_RECEIVE', {
      onClose: async () => {
        await sync({ id: wallet.id });
      }
    });
  }

  const onSendButtonPress = () => {
    showModal('WALLET_SEND', {
      onClose: async () => {
        await sync({ id: wallet.id });
      }
    });
    if( status != 'WALLET_READY' ) {
      showModal('RESPONSE', {
        type: 'WARNING',
        message: localize('General.WalletSyncingText')
      });
    }
  }

  const onScanQRButtonPress = () => {
    showModal('QR_SCANNER');
  }

  const onTransactionsButtonPress = () => {
    navigation.push('Transactions');
  }

  const onSearchRareSatsButtonPress = () => {
    navigation.push('RareSats');
  }

  const onSelectUtxoButtonPress = ({ utxo, selected }) => {
    let newUtxos = [...utxosSelected];
    if( selected == true ) {
      newUtxos.push(utxo);
    } else {
      newUtxos = newUtxos.filter((u) => u.txid != utxo.txid || u.vout != utxo.vout)
    }
    setUtxosSelected(newUtxos);
  }

  const onSendInBatchButtonPress = () => {
    showModal('WALLET_SEND', {
      data: { type: 'bitcoinAddress', address: '', amount: `${utxosSelected.reduce((accumulator, currentValue) => accumulator + currentValue.value, 0)}`, message: '' },
      utxos: utxosSelected,
      onClose: async () => {
        await sync({ id: wallet.id });
      }
    });
    if( status != 'WALLET_READY' ) {
      showModal('RESPONSE', {
        type: 'WARNING',
        message: localize('General.WalletSyncingText')
      });
    }
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
        <ScrollView ref={scrollRef} className='w-full' contentContainerStyle={{ paddingBottom: utxosSelected.length > 0 ? 80 : 20 }} showsVerticalScrollIndicator={false} removeClippedSubviews={true}>
          <View className='w-full bg-white'>
            <View className='w-full items-center'>
              <View className='w-full items-center mt-8'>
                <View className='w-full items-center justify-center'>
                  <Balance value={balance} unconfirmed={unconfirmedBalance} />
                </View>
              </View>
              <View className='w-full px-4 mt-6'>
                <View className='w-full flex-row items-center border border-light-gray rounded-lg px-4'>
                  <Button className='flex-1 h-12 flex-row items-center justify-center' onPress={onReceiveButtonPress}>
                    <Text className='font-gilroy-bold text-black'>{localize('Wallet.ReceiveText')}</Text>
                    <View className='w-3 ml-2'><ReceiveLogo /></View>
                  </Button>
                  <View className='h-[70%] border-l border-light-gray' />
                  <Button className='h-12 flex-row items-center justify-center px-4 mx-4' onPress={onScanQRButtonPress}>
                    <View className='w-5'><ScanLogo /></View>
                  </Button>
                  <View className='h-[70%] border-l border-light-gray' />
                  <Button className='flex-1 h-12 flex-row items-center justify-center' onPress={onSendButtonPress}>
                    <Text className='font-gilroy-bold text-black'>{localize('Wallet.SendText')}</Text>
                    <View className='w-3 ml-2'><SendLogo /></View>
                  </Button>
                </View>
              </View>
            </View>
            <View className='w-full px-4 mt-8'>
              <View className='w-full flex-row items-center'>
                <Button className='flex-1 h-12 flex-row items-center justify-center' onPress={() => setFilter('INSCRIPTIONS')}>
                  <Text className={`${filter == 'INSCRIPTIONS' ? 'font-gilroy-bold' : 'font-gilroy'} text-black`}>{localize('Wallet.InscriptionsText')} ({allInscriptions.length})</Text>
                </Button>
                <View className='h-[70%] border-l border-light-gray' />
                <Button className='flex-1 h-12 flex-row items-center justify-center' onPress={() => setFilter('RARE_SATS')}>
                  <Text className={`${filter == 'RARE_SATS' ? 'font-gilroy-bold' : 'font-gilroy'} text-black`}>{localize('Wallet.RareSatsText')} ({Object.keys(raresats).length})</Text>
                </Button>
                <View className='h-[70%] border-l border-light-gray' />
                <Button className='flex-1 h-12 flex-row items-center justify-center' onPress={() => setFilter('UTXOS')}>
                  <Text className={`${filter == 'UTXOS' ? 'font-gilroy-bold' : 'font-gilroy'} text-black`}>UTXOs ({parsedUtxos.length})</Text>
                </Button>
              </View>
            </View>
          </View>
          {status == 'WALLET_SYNCING' || status == 'WALLET_READY'
            ?
              filter == 'INSCRIPTIONS'
                ?
                  allInscriptions.length == 0
                    ?
                      <View className='w-full p-4'>
                        <View className='w-full items-center justify-center aspect-square bg-light-gray rounded-lg px-16'>
                          <Text className='font-gilroy text-black text-base text-center'>{localize('Wallet.InscriptionsEmptyText1')}</Text>
                          <Text className='font-gilroy-bold text-black text-base text-center'>{localize('Wallet.InscriptionsEmptyText2')}</Text>
                          <Text className='font-gilroy text-black text-base text-center'>{localize('Wallet.InscriptionsEmptyText3')}</Text>
                        </View>
                      </View>
                    :
                      <View className='w-full px-4'>

                        {/* inscriptions with collection */}
                        {Object.keys(inscriptionsWithCollection).map((collectionName, index) => {
                          return <Collection key={index} {...inscriptionsWithCollection[collectionName]} />
                        })}

                        {/* inscriptions without collection */}
                        <InscriptionsList inscriptions={inscriptionsWithoutCollection} />

                      </View>
                :
                  filter == 'RARE_SATS'
                    ?
                      <View className='w-full'>
                        {Object.keys(raresats).length == 0
                          ?
                            <View className='w-full p-4'>
                              <View className='w-full items-center justify-center aspect-[16/10] bg-light-gray rounded-lg px-16'>
                                <Text className='font-gilroy text-black text-base text-center'>{localize('Wallet.RareSatsEmptyText1')}</Text>
                                <Text className='font-gilroy-bold text-black text-base text-center'>{localize('Wallet.RareSatsEmptyText2')}</Text>
                                <Text className='font-gilroy text-black text-base text-center'>{localize('Wallet.RareSatsEmptyText3')}</Text>
                              </View>
                            </View>
                          :
                            <View className='w-full px-4 pb-4'>
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
                              {raresatsBalance > 0 ? <View className='w-full mt-4'>
                                <Text className='font-regular text-dark-gray text-sm'>{localize('Wallet.TotalBalanceText')} <Text className='font-bold text-black'>{numberFormat(raresatsBalance)} sats</Text></Text>
                              </View> : null}
                            </View>
                        }
                        <View className='w-full px-4'>
                          <Button className='w-full h-12 items-center justify-center bg-black rounded-lg' onPress={onSearchRareSatsButtonPress}>
                            <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('Wallet.RareSatsSearchText')}</Text>
                          </Button>
                        </View>
                      </View>
                    :
                      <View className='w-full px-4'>
                        {parsedUtxos.filter((u) => u.locked == true).length > 0 ? <View className='w-full border border-orange rounded-lg px-4 py-2'>
                          <Text className='text-gilroy text-orange text-xs'>{localize('Wallet.ServerNotSyncedText')}</Text>
                        </View> : null}
                        {parsedUtxos.map((utxo, index) => {
                          return (
                            <Fragment key={index}><Utxo utxo={utxo} onSelected={onSelectUtxoButtonPress} /></Fragment>
                          )
                        })}
                      </View>
            :
              null
          }
        </ScrollView>
        {filter == 'UTXOS' && utxosSelected.length > 0
          ?
            <View className='absolute w-full h-16 flex-row items-center bottom-0 bg-dark-gray px-4'>
              <View className='flex-1'>
                <Text className='font-gilroy-bold text-white text-sm'>{localize('Wallet.UtxosSelectedText')}</Text>
                <Text className='font-gilroy text-white text-sm'>{utxosSelected.length}</Text>
              </View>
              <Button className='items-center justify-center px-4 py-2 rounded-lg border border-white' onPress={onSendInBatchButtonPress}>
                <Text className='font-gilroy-bold text-white text-xs'>{localize('Wallet.SendText')}</Text>
              </Button>
            </View>
          :
            null
        }
        {status == 'WALLET_LOCKED' ? <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={5} reducedTransparencyFallbackColor='white' /> : null}
      </CustomSafeAreaView>
    </Fragment>
  );

}
