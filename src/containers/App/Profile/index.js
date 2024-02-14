/* modules */
import { Fragment, useState, useEffect, useLayoutEffect, createElement, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Switch, Animated, Keyboard as KeyboardRN, Platform, Alert } from 'react-native';
import Collapsible from 'react-native-collapsible';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';
import InscriptionPreview from 'components/Inscription/Preview';
import ProfileShare from 'components/Profile/Share';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* utils */
import { numberFormat } from 'utils/number';
import { emptyString, validUrl } from 'utils/string';
import { satsToBtc } from 'utils/blockchain';

/* assets */
import BitcoinLogo from 'assets/svgs/btc.svg';
import SatsLogo from 'assets/svgs/sats.svg';
import CopyLogo from 'assets/svgs/copy.svg';
import QRLogo from 'assets/svgs/qr.svg';
import ShareLogo from 'assets/svgs/shareWhite.svg';
import ArrowLogo from 'assets/svgs/arrow.svg';
import HordesLogo from 'assets/svgs/hordesShare.svg';

import TwitterLogo from 'assets/svgs/socials/twitter.svg';
import LinkedinLogo from 'assets/svgs/socials/linkedin.svg';
import WebLogo from 'assets/svgs/socials/web.svg';
import EditLogo from 'assets/svgs/editWhite.svg';

export default function Profile({ navigation }) {

  /* refs */
  const keyboardPadding = useRef(new Animated.Value(0)).current;
  const shareRef = useRef(null);

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { account: { profile }, updateAccount, saveProfile } = useAccount();

  /* wallet context */
  const { address, balance, dummyBalance, inscriptions } = useWallet();

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [showBalaceInSats, setShowBalanceInSats] = useState(false);
  const [showAddresses, setShowAddresses] = useState(true);
  const [showSocials, setShowSocials] = useState(true);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Profile.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  useEffect(() => {

    const keyboardWillShowListener = KeyboardRN.addListener('keyboardWillShow', (event) => {
      if( Platform.OS === 'android' ) return;
      Animated.timing(keyboardPadding, {
        duration: event.duration,
        toValue: event.endCoordinates.height - (56 + 36),
        useNativeDriver: false
      }).start();
    });
    const keyboardWillHideListener = KeyboardRN.addListener('keyboardWillHide', (event) => {
      if( Platform.OS === 'android' ) return;
      Animated.timing(keyboardPadding, {
        duration: event.duration,
        toValue: 0,
        useNativeDriver: false
      }).start();
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };

  }, []);

  /* actions */
  const onChooseImageButtonPress = () => {
    showModal('PROFILE_CHOOSE_IMAGE')
  }

  const onCopyButtonPress = (addressType) => {
    Clipboard.setString(addressType == 'ORDINALS' ? address.ordinals : address.payments);
    showModal('RESPONSE', {
      type: 'SUCCESS',
      message: localize('General.CopiedText')
    });
  }

  const onShareButtonPress = async () => {
    let uri = await shareRef.current?.capture();
    if( uri ) {
      Share.open({
        message: localize('Share.ProfileMessageText'),
        url: uri
      }).then(() => {}).catch(() => {});
    }
  }

  const onReceiveButtonPress = (addressType) => {
    showModal('WALLET_RECEIVE', {
      addressType: addressType
    });
  }

  const onEndEditingSocials = () => {
    let error = null;
    if( validUrl(profile.socials.twitter.value) ) {
      updateAccount('profile.socials.twitter.value', '');
      error = 'Wrong twitter handle';
      return
    }
    if( validUrl(profile.socials.linkedin.value) ) {
      updateAccount('profile.socials.linkedin.value', '');
      error = 'Wrong linkedin handle';
      return
    }
    if( error ) {
      Alert.alert('Hordes', error);
    }
  }

  const onEndEditingWeb = () => {
    if( profile.socials.webs.filter((web) => !emptyString(web.value) && !validUrl(web.value)).length > 0 ) {
      Alert.alert('Hordes', 'Wrong url format');
    }
    let validUrls = profile.socials.webs.filter((web) => !emptyString(web.value) && validUrl(web.value));
    validUrls.push({ value: '', visible: false });
    updateAccount('profile.socials.webs', validUrls);
  }

  /* ui */
  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <Animated.View className='w-full flex-1' style={{ marginBottom: Platform.OS === 'ios' ? keyboardPadding : 0 }}>
        <ScrollView className='w-full bg-white' contentContainerStyle={{ paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
          <View className='w-full px-4'>
            <View className='w-full items-center'>
              {inscriptions.length > 0
                ?
                  <View className='w-32 h-32 rounded-full overflow-hidden mb-2'>
                    <InscriptionPreview key={`profile-${profile.icon?.id}`} inscriptionId={profile.icon?.id} type={profile.icon?.content_type} textSize='text-xs' />
                    <Button className='absolute w-full h-full items-center justify-center' style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} onPress={onChooseImageButtonPress}><View className='w-8 h-8'><EditLogo /></View></Button>
                  </View>
                :
                  <View className='w-32 h-32 items-center justify-center rounded-full overflow-hidden bg-light-gray mb-2'>
                    <View className='w-12 h-12'><HordesLogo /></View>
                  </View>
              }
              <View className='w-full'>
                <View className='h-10 flex-row items-end justify-center'>
                  <TextInput className='max-w-[90%] pb-0 font-gilroy text-xl android:text-center android:w-[50%]' value={profile.username} onChangeText={(value) => updateAccount('profile.username', value)} autoCapitalize='none' autoComplete='off' autoCorrect={false} placeholder={localize('Profile.UsernameText')} placeholderTextColor='#bebebe' />
                </View>
                <Button className='mt-4' onPress={() => setShowBalanceInSats(!showBalaceInSats)}>
                  <View className='flex-row items-center justify-center'>
                    <Text className='font-gilroy-bold text-black text-sm'>{localize('Profile.BalanceText')}</Text>
                    <View className='w-5 h-5 mx-2'>{showBalaceInSats ? <SatsLogo /> : <BitcoinLogo />}</View>
                    <Text className='font-gilroy text-dark-gray text-sm'>{numberFormat(showBalaceInSats ? balance : satsToBtc(balance))}</Text>
                  </View>
                </Button>
                {dummyBalance > 0
                  ?
                    <Button className='mt-2' onPress={() => setShowBalanceInSats(!showBalaceInSats)}>
                      <View className='flex-row items-center justify-center'>
                        <Text className='font-gilroy-bold text-black text-sm'>{localize('Profile.DummyBalanceText')}</Text>
                        <View className='w-5 h-5 mx-2'>{showBalaceInSats ? <SatsLogo /> : <BitcoinLogo />}</View>
                        <Text className='font-gilroy text-dark-gray text-sm'>{numberFormat(showBalaceInSats ? dummyBalance : satsToBtc(dummyBalance))}</Text>
                      </View>
                    </Button>
                  :
                    null
                }
              </View>
            </View>
            <View className='w-full border-t border-t-light-gray mt-4 mb-8' />
            <View className='w-full items-center px-4'>
              <Text className='font-gilroy-bold text-black text-base'>{localize('Profile.AddressesText')}</Text>
              <View className='w-full border border-light-gray rounded-lg mt-4'>
                <View className='w-full p-4'>
                  <View className='w-full flex-row items-center'>
                    <View className='flex-1'><Text className='font-gilroy-bold text-black text-sm'>{localize('Profile.OrdinalsAddressText')}</Text></View>
                    <Button className='w-5 h-5' onPress={() => onCopyButtonPress('ORDINALS')}><CopyLogo /></Button>
                    <Button className='w-5 h-5 ml-4' onPress={() => onReceiveButtonPress('ORDINALS')}><QRLogo /></Button>
                  </View>
                  <Text className='font-gilroy text-dark-gray text-xs mt-4'>{address.ordinals}</Text>
                </View>
                <View className='w-full border-t border-t-light-gray' />
                <View className='w-full p-4'>
                  <View className='w-full flex-row items-center'>
                    <View className='flex-1'><Text className='font-gilroy-bold text-black text-sm'>{localize('Profile.PaymentsAddressText')}</Text></View>
                    <Button className='w-5 h-5' onPress={() => onCopyButtonPress('PAYMENTS')}><CopyLogo /></Button>
                    <Button className='w-5 h-5 ml-4' onPress={() => onReceiveButtonPress('PAYMENTS')}><QRLogo /></Button>
                  </View>
                  <Text className='font-gilroy text-dark-gray text-xs mt-4'>{address.payments}</Text>
                </View>
              </View>
            </View>
            <View className='w-full items-center px-4 mt-8'>
              <Text className='font-gilroy-bold text-black text-base'>{localize('Profile.SocialsText')}</Text>
              <View className='w-full mt-4'>
                <View className='w-full h-12 flex-row items-center border border-light-gray rounded-lg pl-4 pr-2'>
                  <View className='w-6 h-6'><TwitterLogo /></View>
                  <TextInput className='flex-1 h-full font-gilroy text-sm mx-6' value={profile.socials.twitter.value} onChangeText={(value) => updateAccount('profile.socials.twitter.value', value)} onBlur={onEndEditingSocials} autoCapitalize='none' autoComplete='off' autoCorrect={false} placeholder='Write here...' placeholderTextColor='#bebebe' />
                  <Switch disabled={emptyString(profile.socials.twitter.value)} className='scale-75' trackColor={{ false: '#eaeaea', true: '#303030' }} thumbColor='white' value={emptyString(profile.socials.twitter.value) ? false : profile.socials.twitter.visible} onValueChange={(value) => updateAccount('profile.socials.twitter.visible', value)} />
                </View>
                <View className='w-full h-12 flex-row items-center border border-light-gray rounded-lg pl-4 pr-2 mt-4'>
                  <View className='w-6 h-6'><LinkedinLogo /></View>
                  <TextInput className='flex-1 h-full font-gilroy text-sm mx-6' value={profile.socials.linkedin.value} onChangeText={(value) => updateAccount('profile.socials.linkedin.value', value)} onBlur={onEndEditingSocials} autoCapitalize='none' autoComplete='off' autoCorrect={false} placeholder='Write here...' placeholderTextColor='#bebebe' />
                  <Switch disabled={emptyString(profile.socials.linkedin.value)} className='scale-75' trackColor={{ false: '#eaeaea', true: '#303030' }} thumbColor='white' value={emptyString(profile.socials.linkedin.value) ? false : profile.socials.linkedin.visible} onValueChange={(value) => updateAccount('profile.socials.linkedin.visible', value)} />
                </View>
                {profile.socials.webs.map((web, index) => {
                  return (
                    <View key={index} className='w-full h-12 flex-row items-center border border-light-gray rounded-lg pl-4 pr-2 mt-4'>
                      <View className='w-6 h-6'><WebLogo /></View>
                      <TextInput className='flex-1 h-full font-gilroy text-sm mx-6' value={profile.socials.webs[index].value} onChangeText={(value) => updateAccount(`profile.socials.webs.${index}.value`, value)} onBlur={onEndEditingWeb} autoCapitalize='none' autoComplete='off' autoCorrect={false} placeholder='Write here...' placeholderTextColor='#bebebe' />
                      <Switch disabled={emptyString(web.value) || !validUrl(web.value)} className='scale-75' trackColor={{ false: '#eaeaea', true: '#303030' }} thumbColor='white' value={emptyString(web.value) || !validUrl(web.value) ? false : profile.socials.webs[index].visible} onValueChange={(value) => updateAccount(`profile.socials.webs.${index}.visible`, value)} />
                    </View>
                  )
                })}
              </View>
            </View>
          </View>
          <View className='w-full justify-center px-4 mt-8'>
            <Button className='w-full h-12 items-center justify-center bg-black rounded-lg' onPress={onShareButtonPress}>
              <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize('Profile.ShareText')}</Text>
              <View className='absolute right-4 w-5 h-5 items-center justify-center'><ShareLogo /></View>
            </Button>
          </View>
          <ViewShot ref={shareRef} options={{ format: 'png', quality: 1 }} className='absolute w-[100%] h-auto -top-[10000]'>
            <ProfileShare />
          </ViewShot>
        </ScrollView>
      </Animated.View>
    </CustomSafeAreaView>
  )

}
