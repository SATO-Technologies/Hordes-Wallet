/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';

/* components */
import Modal from 'components/Modal';
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import InscriptionsList from 'components/Inscription/List';
import InscriptionPreview from 'components/Inscription/Preview';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* managers */
import hordesApi from 'managers/hordes';
import ordinalsApi from 'managers/ordinals';
import mempoolApi from 'managers/mempool';

/* hooks */
import useBackHandler from 'hooks/useBackHandler';

/* utils */
import { emptyString, ellipsis } from 'utils/string';
import { numberFormat } from 'utils/number';
import { satsToBtc } from 'utils/blockchain';
import { sortInscriptions } from 'utils/ordinals';

/* assets */
import CloseLogo from 'assets/svgs/close.svg';
import ShareLogo from 'assets/svgs/shareWhite.svg';
import HordesLogo from 'assets/svgs/hordesShare.svg';
import AlertLogo from 'assets/svgs/alert.svg';
import BitcoinLogo from 'assets/svgs/btc.svg';
import CopyLogo from 'assets/svgs/copy.svg';
import SendLogo from 'assets/svgs/send.svg';
import TwitterLogo from 'assets/svgs/socials/twitter.svg';
import LinkedinLogo from 'assets/svgs/socials/linkedin.svg';
import WebLogo from 'assets/svgs/socials/web.svg';

export default function ProfileUser({ navigation, route: { params: { address }} }) {

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { status } = useWallet();

  /* modals context */
  const { showModal, hideModal } = useModals();

  /* states */
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState(null);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Profile.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  useEffect(() => {

    const doAsyncRequest = async () => {

      let profileObject = await hordesApi.account.fetchProfile({ address: address, app: global.app });
      if( !profileObject ) profileObject = { address: { payments: address } }

      /* fetch inscriptions */
      let profileInscriptions = await ordinalsApi.wallet.address.getInscriptions({ address: address });
      if( profileInscriptions ) profileObject.inscriptions = sortInscriptions(profileInscriptions);

      /* fetch balance */
      profileObject.balance = profileObject.address?.payments ? (await mempoolApi.getAddressBalance({ address: profileObject.address.payments }) || 0) : 0;

      setProfile(profileObject);

    }
    doAsyncRequest();

  }, []);

  /* data */
  const buildUrl = (social, value) => {
    switch (social) {
      case 'twitter':
        return `https://twitter.com/${value}`;
      case 'linkedin':
        return `https://www.linkedin.com/in/${value}`;
    }
    return '';
  }

  /* actions */
  const onCloseModalButtonPress = (length) => {
    setShow(false);
    setTimeout(async () => {
      if( onClose ) onClose();
      hideModal(name);
    }, 250);
  }

  const onCopyButtonPress = (addressType) => {
    Clipboard.setString(addressType == 'ORDINALS' ? profile.address.ordinals : profile.address.payments);
    showModal('RESPONSE', {
      type: 'SUCCESS',
      message: localize('General.CopiedText')
    });
  }

  const onSendButtonPress = () => {
    showModal('WALLET_SEND', {
      data: {
        type: 'bitcoinAddress',
        address: profile.address.payments,
        amount: '0',
        message: ''
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
  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      {profile
        ?
          <View className='w-full flex-1'>
            <ScrollView className='w-full h-full' showsVerticalScrollIndicator={false}>
              <View className='w-full items-center'>
                {profile.icon
                  ?
                    <View className='w-32 h-32 rounded-full overflow-hidden mb-2'>
                      <InscriptionPreview key={`profile-user-${profile.icon.id}`} inscriptionId={profile.icon.id} type={profile.icon.content_type} textSize='text-xs' />
                    </View>
                  :
                    <View className='w-32 h-32 items-center justify-center rounded-full overflow-hidden bg-light-gray mb-2'>
                      <View className='w-12 h-12'><HordesLogo /></View>
                    </View>
                }
                <View className='w-full mt-2'>
                  {!emptyString(profile.username) ? <View className='h-10 flex-row items-end justify-center'>
                    <Text className='font-gilroy text-xl'>{profile.username}</Text>
                  </View> : null}
                  <View className='mt-2'>
                    <View className='flex-row items-center justify-center'>
                      <Text className='font-gilroy text-black text-sm'>{localize('Profile.BalanceText')}</Text>
                      <View className='w-5 h-5 mx-2'><BitcoinLogo /></View>
                      <Text className='font-gilroy text-black text-sm'>{numberFormat(satsToBtc(profile.balance || 0))}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View className='w-full border-t border-t-light-gray mt-4 mb-8' />
              {profile.address && (profile.address.ordinals || profile.address.payments) ? <View className='w-full items-center px-4'>
                <Text className='font-gilroy-bold text-black text-base'>{localize('Profile.AddressesText')}</Text>
                <View className='w-full border border-light-gray rounded-lg mt-4'>
                  {profile.address.ordinals
                    ?
                      <Fragment>
                        <View className='w-full p-4'>
                          <View className='w-full flex-row items-center'>
                            <View className='flex-1'><Text className='font-gilroy-bold text-black text-sm'>{localize('Profile.OrdinalsAddressText')}</Text></View>
                            <Button className='w-5 h-5' onPress={() => onCopyButtonPress('ORDINALS')}><CopyLogo /></Button>
                          </View>
                          <Text className='font-gilroy text-dark-gray text-xs mt-4'>{profile.address.ordinals}</Text>
                        </View>
                        <View className='w-full border-t border-t-light-gray' />
                      </Fragment>
                    :
                      null
                  }
                  <View className='w-full p-4'>
                    <View className='w-full flex-row items-center'>
                      <View className='flex-1'><Text className='font-gilroy-bold text-black text-sm'>{localize('Profile.PaymentsAddressText')}</Text></View>
                      <Button className='w-5 h-5' onPress={() => onCopyButtonPress('PAYMENTS')}><CopyLogo /></Button>
                      <Button className='w-5 h-5 ml-4' onPress={() => onSendButtonPress('PAYMENTS')}><SendLogo /></Button>
                    </View>
                    <Text className='font-gilroy text-dark-gray text-xs mt-4'>{profile.address.payments}</Text>
                  </View>
                </View>
              </View> : null}
              {profile.socials ? <View className='w-full items-center px-4 mt-8'>
                <Text className='font-gilroy-bold text-black text-base'>{localize('Profile.SocialsText')}</Text>
                <View className='w-full flex-row flex-wrap items-center justify-center mt-4 pr-4'>
                  {Object.keys(profile.socials).map((socialKey, index) => {
                    if( socialKey == 'webs' ) {
                      return profile.socials[socialKey].map((url, urlIndex) => {
                        if( url.visible != true ) return null;
                        return (
                          <Button key={urlIndex} className='w-14 h-14 p-3 border border-light-gray rounded-lg ml-4' onPress={() => Linking.openURL(url.value)}>
                            <WebLogo />
                          </Button>
                        )
                      });
                    }
                    if( emptyString(profile.socials[socialKey].value) || profile.socials[socialKey].visible != true ) return null;
                    return (
                      <Button key={index} className='w-14 h-14 p-3 border border-light-gray rounded-lg ml-4' onPress={() => Linking.openURL(buildUrl(socialKey, profile.socials[socialKey].value))}>
                        {socialKey == 'twitter' ? <TwitterLogo /> : socialKey == 'linkedin' ? <LinkedinLogo /> : null}
                      </Button>
                    )
                  })}
                </View>
              </View> : null}
              <View className='w-full items-center px-4 mt-6'>
                <Text className='font-gilroy-bold text-black text-base'>{localize('Profile.InscriptionsText')} ({(profile.inscriptions || []).length})</Text>
                <InscriptionsList inscriptions={profile.inscriptions || []} />
              </View>
            </ScrollView>
          </View>
        :
          <View className='w-full flex-1 items-center justify-center mt-8'>
            <ActivityIndicator size='large' color='#303030' />
          </View>
      }
    </CustomSafeAreaView>
  )

}
