/* modules */
import { Fragment, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

/* utils */
import { numberFormat } from 'utils/number';
import { msatToSat } from 'utils/blockchain';

/* containers */
import Splash from 'containers/Splash';

/* app flow */

/* fte flow */
import WalletCreate from 'containers/App/Wallet/Create';
import WalletCreateImport from 'containers/App/Wallet/Create/Import';
import WalletCreatePasscode from 'containers/App/Wallet/Create/Passcode';
import WalletCreateBiometrics from 'containers/App/Wallet/Create/Biometrics';
import WalletCreateFinalize from 'containers/App/Wallet/Create/Finalize';

/* settings tab bar */
import Settings from 'containers/App/Settings';
import SettingsCurrencies from 'containers/App/Settings/Currencies';
import SettingsLanguage from 'containers/App/Settings/Language';
import SettingsBlockchain from 'containers/App/Settings/Blockchain';
import SettingsBackUp from 'containers/App/Settings/BackUp';
import SettingsBackUpFinalize from 'containers/App/Settings/BackUp/Finalize';
import SettingsSignMessage from 'containers/App/Settings/Sign/Message';

/* gifts tab bar */
import Gifts from 'containers/App/Gifts';

/* wallet tab bar */
import Wallet from 'containers/App/Wallet';
import Inscription from 'containers/App/Wallet/Inscription';
import Collection from 'containers/App/Wallet/Collection';
import Transactions from 'containers/App/Wallet/Transactions';
import RareSats from 'containers/App/Wallet/RareSats';
import MarketPlaces from 'containers/App/Wallet/MarketPlaces';
import Browser from 'containers/App/Wallet/Browser';

/* profile tab bar */
import Profile from 'containers/App/Profile';
import ProfileUser from 'containers/App/Profile/User';

/* components */
import TabBar from 'components/TabBar';

/* modals */
import Modals from 'modals';

/* contexts */
import LocalizationProvider, { useLocalization } from 'contexts/localization';
import AccountProvider from 'contexts/account';
import WalletProvider, { useWallet } from 'contexts/wallet';
import MempoolProvider, { useMempool } from 'contexts/mempool';
import CurrenciesProvider, { useCurrencies } from 'contexts/currencies';
import ModalsProvider, { useModals } from 'contexts/modals';

/* hooks */
import useDeepLink from 'hooks/useDeepLink';

/* stack navigators */
const Tab = createBottomTabNavigator();
const SplashStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const GiftsStack = createNativeStackNavigator();
const WalletStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

/* stack screens */
const SettingsStackScreens = ({ route, navigation }) => {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: true, headerLargeTitle: false, headerShadowVisible: false, headerTintColor: '#303030' }}>
      <SettingsStack.Screen name='Settings' component={Settings} />
      <SettingsStack.Screen name='Currencies' component={SettingsCurrencies} />
      <SettingsStack.Screen name='Language' component={SettingsLanguage} />
      <SettingsStack.Screen name='Blockchain' component={SettingsBlockchain} />
      <SettingsStack.Screen name='BackUp' component={SettingsBackUp} />
      <SettingsStack.Screen name='BackUpFinalize' component={SettingsBackUpFinalize} />
      <SettingsStack.Screen name='SignMessage' component={SettingsSignMessage} />
    </SettingsStack.Navigator>
  )
}

const GiftsStackScreens = ({ route, navigation }) => {
  return (
    <GiftsStack.Navigator screenOptions={{ headerShown: true, headerLargeTitle: false, headerShadowVisible: false, headerTintColor: '#303030' }}>
      <GiftsStack.Screen name='Gifts' component={Gifts} />
      <GiftsStack.Screen name='Profile' component={ProfileUser} />
      <GiftsStack.Screen name='Collection' component={Collection} />
      <GiftsStack.Screen name='Inscription' component={Inscription} />
    </GiftsStack.Navigator>
  )

}

const WalletStackScreens = ({ route, navigation }) => {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: true, headerLargeTitle: false, headerShadowVisible: false, headerTintColor: '#303030' }}>
      <WalletStack.Screen name='Wallet' component={Wallet} />
      <WalletStack.Screen name='Inscription' component={Inscription} />
      <WalletStack.Screen name='Collection' component={Collection} />
      <WalletStack.Screen name='Transactions' component={Transactions} />
      <WalletStack.Screen name='RareSats' component={RareSats} />
      <WalletStack.Screen name='Profile' component={ProfileUser} />
      <WalletStack.Screen name='MarketPlaces' component={MarketPlaces} />
      <WalletStack.Screen name='Browser' component={Browser} />
    </WalletStack.Navigator>
  )
}

const ProfileStackScreens = ({ route, navigation }) => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: true, headerLargeTitle: false, headerShadowVisible: false, headerTintColor: '#303030' }}>
      <ProfileStack.Screen name='Profile' component={Profile} />
      <ProfileStack.Screen name='Inscription' component={Inscription} />
    </ProfileStack.Navigator>
  )
}

function MainApp() {

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { wallet, status, initializeWallet } = useWallet();

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [minimumDataReady, setMinimumDataReady] = useState(false);

  /* effects */
  useEffect(() => {

    if( !wallet ) return;
    switch (status) {
      case 'WALLET_LOCKED':
        showModal('BIOMETRICS_AUTHENTICATOR', {
          onSuccess: () => {
            showModal('PASSCODE_AUTHENTICATOR', {
              mnemonic: wallet.mnemonic,
              onSuccess: (mnemonic) => {
                initializeWallet({ ...wallet, mnemonic: mnemonic });
              }
            });
          }
        });
        break;
      case 'WALLET_SYNCING':
        setMinimumDataReady(true);
        break;
    }

  }, [wallet, status]);

  /* deeplink */
  useDeepLink({
    minimumDataReady: minimumDataReady,
    showModal: showModal
  });

  /* ui */
  return (
    <Fragment>
      {status == 'UNKNOWN_STATUS'
        ?
          <SplashStack.Navigator screenOptions={{ headerShown: false }}>
            <SplashStack.Screen name='Splash' component={Splash} />
          </SplashStack.Navigator>
        :
          status == 'WALLET_NOT_INITIALIZED'
            ?
              <WalletStack.Navigator screenOptions={{ headerShown: true, headerLargeTitle: false, headerShadowVisible: false, headerTintColor: '#303030' }}>
                <WalletStack.Screen name='WalletCreate' component={WalletCreate} />
                <WalletStack.Screen name='WalletCreateImport' component={WalletCreateImport} />
                <WalletStack.Screen name='WalletCreatePasscode' component={WalletCreatePasscode} />
                <WalletStack.Screen name='WalletCreatePasscodeConfirm' component={WalletCreatePasscode} />
                <WalletStack.Screen name='WalletCreateBiometrics' component={WalletCreateBiometrics} />
                <WalletStack.Screen name='WalletCreateFinalize' component={WalletCreateFinalize} />
              </WalletStack.Navigator>
            :
              <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, headerLargeTitle: false, headerShadowVisible: false, headerTintColor: '#303030' }} options={{ tabBarStyle: { display: 'none' } }} initialRouteName='WalletTab'>
                <Tab.Screen name='SettingsTab' options={{ tabBarLabel: 'Settings', tabBarName: 'Settings' }} component={SettingsStackScreens} />
                <Tab.Screen name='GiftsTab' options={{ tabBarLabel: 'Gifts', tabBarName: 'Gifts' }} component={GiftsStackScreens} />
                <Tab.Screen name='WalletTab' options={{ tabBarLabel: 'Wallet', tabBarName: 'Wallet' }} component={WalletStackScreens} />
                <Tab.Screen name='ProfileTab' options={{ tabBarLabel: 'Profile', tabBarName: 'Profile' }} component={ProfileStackScreens} />
              </Tab.Navigator>
        }
      <Modals />
    </Fragment>
  )

}

export default function App() {

  /* ui */
  return (
    <NavigationContainer>
      <LocalizationProvider>
        <AccountProvider>
          <WalletProvider>
            <MempoolProvider>
              <CurrenciesProvider>
                <ModalsProvider>
                  <MainApp />
                </ModalsProvider>
              </CurrenciesProvider>
            </MempoolProvider>
          </WalletProvider>
        </AccountProvider>
      </LocalizationProvider>
    </NavigationContainer>
  );

}
