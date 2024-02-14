/* modules */
import { Fragment, useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import Keyboard from 'components/Keyboard';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* utils */
import { emptyString, ellipsis } from 'utils/string';
import { numberFormat } from 'utils/number';
import { msatToSat } from 'utils/blockchain';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';
import ShareLogo from 'assets/svgs/shareWhite.svg';
import HordesLogo from 'assets/svgs/hordes.svg';
import AlertLogo from 'assets/svgs/alert.svg';

export default function WalletReceive({ name, onClose, addressType: addressTypeParam }) {

  /* refs */
  const shareBitcoinRef = useRef(null);
  const shareLightningRef = useRef(null);

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { address } = useWallet();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [addressType, setAddressType] = useState(addressTypeParam || 'ORDINALS'); // ORDINALS - PAYMENTS

  /* effects */
  useEffect(() => {
    setShow(true);
  }, []);

  /* hooks */
  useBackHandler(() => {
    onCloseModalButtonPress(null);
    return true;
  });

  /* actions */
  const onCloseModalButtonPress = (length) => {
    setShow(false);
    setTimeout(async () => {
      if( onClose ) onClose();
      hideModal(name);
    }, 250);
  }

  const onCopyButtonPress = () => {
    Clipboard.setString(addressType == 'ORDINALS' ? address.ordinals : address.payments);
    showModal('RESPONSE', {
      type: 'SUCCESS',
      message: localize('General.CopiedText')
    });
  }

  const onShareButtonPress = async () => {
    let uri = null;
    if( addressType == 'PAYMENTS' ) {
      uri = await shareBitcoinRef.current?.capture();
    } else {
      uri = await shareLightningRef.current?.capture();
    }
    if( uri ) {
      Share.open({
        message: localize(addressType == 'ORDINALS' ? 'WalletReceive.OrdinalsAddressShareText' : 'WalletReceive.PaymentsAddressShareText', [addressType == 'ORDINALS' ? address.ordinals : address.payments]),
        url: uri
      }).then(() => {}).catch(() => {});
    }
  }

  /* ui */
  return (
    <Modal show={show}>
      <View className='w-full flex-1'>
        <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} blurType='dark' blurAmount={5} reducedTransparencyFallbackColor='white' />
        <CustomSafeAreaView cn='w-full flex-1'>
          <View className='w-full flex-1 justify-end'>
            <View className='w-full items-center bg-white rounded-t-xl px-4'>
              <View className='w-full h-20 items-center justify-center'>
                <Text className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('WalletReceive.HeaderText')}</Text>
                <Button className='absolute right-0 bg-light-gray rounded-full p-3' onPress={onCloseModalButtonPress}><CloseLogo width={15} height={15} /></Button>
              </View>
              <View className='w-full px-4'>
                <View className='w-full flex-row items-center bg-light-gray rounded-lg px-4'>
                  <Button className='flex-1 h-14 flex-row items-center justify-center' onPress={() => setAddressType('ORDINALS')}>
                    <Text className={`${addressType == 'ORDINALS' ? 'font-gilroy-bold' : 'font-gilroy'} text-black`}>{localize('WalletReceive.OrdinalsAddressText')}</Text>
                  </Button>
                  <View className='h-[60%] border-l border-dark-gray mx-2' />
                  <Button className='flex-1 h-14 flex-row items-center justify-center' onPress={() => setAddressType('PAYMENTS')}>
                    <Text className={`${addressType == 'PAYMENTS' ? 'font-gilroy-bold' : 'font-gilroy'} text-black`}>{localize('WalletReceive.PaymentsAddressText')}</Text>
                  </Button>
                </View>
              </View>
              <ScrollView className='w-full max-h-[78%] mt-4' contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                <View className='w-full items-center my-4'>
                  <View className='w-10 h-10'><AlertLogo /></View>
                  <Text className='font-gilroy text-black text-sm text-center mt-2'>{addressType == 'ORDINALS' ? localize('WalletReceive.OrdinalsMessageText') : localize('WalletReceive.PaymentsMessageText')}</Text>
                </View>
                <View className='w-full items-center justify-center rounded-lg mt-4'>
                  <ViewShot ref={shareBitcoinRef} options={{ format: 'png', quality: 1 }} className='w-full items-center border border-light-gray rounded-lg p-4'>
                    <View className='items-center justify-center rounded-lg bg-white p-4'>
                      <QRCode value={`bitcoin:${addressType == 'ORDINALS' ? address.ordinals : address.payments}`} color='#68717b' size={Dimensions.get('window').width * 0.5} />
                      <View className='absolute w-12 h-12 items-center justify-center bg-black rounded-full p-3'>
                        <HordesLogo />
                      </View>
                    </View>
                    <View className='w-full mt-4'>
                      <Text className='font-gilroy text-black text-center'>{addressType == 'ORDINALS' ? address.ordinals : address.payments}</Text>
                    </View>
                  </ViewShot>
                </View>
                <View className='w-full flex-row mt-8'>
                  <Button className='flex-1 h-12 items-center justify-center bg-black rounded-lg' onPress={onCopyButtonPress}>
                    <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('WalletReceive.CopyText')}</Text>
                  </Button>
                  <View className='w-4' />
                  <Button className='flex-1 h-12 items-center justify-center bg-black rounded-lg' onPress={onShareButtonPress}>
                    <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('WalletReceive.ShareText')}</Text>
                    <View className='absolute right-4 w-5 h-5 items-center justify-center'><ShareLogo /></View>
                  </Button>
                </View>
              </ScrollView>
            </View>
          </View>
        </CustomSafeAreaView>
        <SafeAreaView className='flex-0 bg-white' />
      </View>
    </Modal>
  );

}
