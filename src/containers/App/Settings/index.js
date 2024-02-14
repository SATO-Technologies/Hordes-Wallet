/* modules */
import { Fragment, useState, useEffect, useLayoutEffect, createElement } from 'react';
import { View, Text, ScrollView, Alert, Linking, Platform } from 'react-native';
import VersionNumber from 'react-native-version-number';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* assets */
import ArrowLogo from 'assets/svgs/arrow.svg';
import CurrenciesLogo from 'assets/svgs/currencies.svg';
import LanguageLogo from 'assets/svgs/languages.svg';
import BackUpLogo from 'assets/svgs/backUp.svg';
import BackUpOffLogo from 'assets/svgs/backUpOff.svg';
import BlockchainLogo from 'assets/svgs/blockchain.svg';
import SupportLogo from 'assets/svgs/support.svg';
import LogOutLogo from 'assets/svgs/logout.svg';
import TwitterLogo from 'assets/svgs/socials/twitter.svg';
import DiscordLogo from 'assets/svgs/socials/discord.svg';
import GithubLogo from 'assets/svgs/socials/github.svg';

export default function Settings({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { account, updateAccount } = useAccount();

  /* wallet context */
  const { status } = useWallet();

  /* modals context */
  const { showModal } = useModals();

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Settings.HeaderText')}</Text>,
      headerLargeTitle: false,
      headerRight: () => (
        <Button onPress={() => Platform.OS === 'ios' ? Linking.openURL('https://apps.apple.com/us/app/hordes-wallet/id6446144699') : Linking.openURL('https://play.google.com/store/apps/details?id=com.sato.hordes')}>
          <Text className='font-gilroy text-dark-gray text-sm'>v{VersionNumber.appVersion} - Build {VersionNumber.buildVersion}</Text>
        </Button>
      )
    });

  }, []);

  /* actions */
  const onLogOutButtonPress = async () => {
    showModal('WALLET_DELETE');
  }

  /* ui */
  const drawMenuItem = ({ title, icon, screenName, action }) => {
    return (
      <Button className='w-full flex-row items-center border-b border-b-light-gray rounded-lg px-4 py-2' onPress={() => screenName ? navigation.push(screenName) : action ? action() : null}>
        <View className='w-10 h-10 py-2'>{createElement(icon)}</View>
        <View className='flex-1 px-4'>
          <Text className='font-regular text-dark-gray text-base'>{title}</Text>
        </View>
        <View className='w-4 h-4'><ArrowLogo style={{ transform: [{ rotate: '180deg' }]}} /></View>
      </Button>
    )
  }

  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <View className='w-full flex-1'>
        <ScrollView className='w-full px-4' contentContainerStyle={{ paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
          <View className='w-full min-h-[75%]'>
            {drawMenuItem({ title: localize('Settings.MenuCurrenciesText'), icon: CurrenciesLogo, screenName: 'Currencies' })}
            {drawMenuItem({ title: localize('Settings.MenuLanguageText'), icon: LanguageLogo, screenName: 'Language' })}
            {drawMenuItem({ title: localize('Settings.MenuBlockchainText'), icon: BlockchainLogo, screenName: 'Blockchain' })}
            {drawMenuItem({ title: localize('Settings.MenuSignMessageText'), icon: BlockchainLogo, screenName: 'SignMessage' })}
            {/*drawMenuItem({ title: 'Sign Transaction', icon: BlockchainLogo, screenName: 'SignTransaction' })*/}
            {status == 'WALLET_NOT_INITIALIZED' ? null : drawMenuItem({ title: localize('Settings.MenuBackUpText'), icon: account.backup == true ? BackUpLogo : BackUpOffLogo, screenName: 'BackUp' })}
            {drawMenuItem({ title: localize('Settings.MenuSupportText'), icon: SupportLogo, action: () => Linking.openURL('https://discord.gg/4rnvMmmABt') })}
            {status == 'WALLET_NOT_INITIALIZED' ? null : drawMenuItem({ title: localize('Settings.MenuDeleteAccountText'), icon: LogOutLogo, action: onLogOutButtonPress })}
          </View>
        </ScrollView>
      </View>
      <View className='w-full px-4 my-4'>
        <View className='w-full h-24 flex-row border border-light-gray rounded-lg'>
          <Button className='flex-1 items-center justify-center' onPress={() => Linking.openURL('https://twitter.com/Hordes_Wallet')}>
            <Text className='font-gilroy text-black text-sm'>{localize('Settings.FollowUsText')}</Text>
            <Text className='font-gilroy-bold text-black text-sm'>Twitter</Text>
            <View className='w-5 h-5 mt-2'><TwitterLogo /></View>
          </Button>
          <View className='h-full border-l border-l-light-gray' />
          <Button className='flex-1 items-center justify-center' onPress={() => Linking.openURL('https://discord.gg/4rnvMmmABt')}>
            <Text className='font-gilroy text-black text-sm'>{localize('Settings.JoinUsText')}</Text>
            <Text className='font-gilroy-bold text-black text-sm'>Discord</Text>
            <View className='w-5 h-5 mt-2'><DiscordLogo /></View>
          </Button>
          <View className='h-full border-l border-l-light-gray' />
          <Button className='flex-1 items-center justify-center' onPress={() => Linking.openURL('https://github.com/SATO-Technologies')}>
            <Text className='font-gilroy text-black text-sm'>{localize('Settings.ReviewCodeText')}</Text>
            <Text className='font-gilroy-bold text-black text-sm'>Github</Text>
            <View className='w-5 h-5 mt-2'><GithubLogo /></View>
          </Button>
        </View>
      </View>
    </CustomSafeAreaView>
  )

}
