/* modules */
import { useState } from 'react';
import { SafeAreaView, View, Text, DeviceEventEmitter, Platform } from 'react-native';

/* components */
import Button from 'components/Button';
import CustomSafeAreaView from 'components/SafeAreaView';

/* assets */
import SettingsOffLogo from 'assets/svgs/settingsOff.svg';
import SettingsOnLogo from 'assets/svgs/settingsOn.svg';
import GiftsOffLogo from 'assets/svgs/giftsOff.svg';
import GiftsOnLogo from 'assets/svgs/giftsOn.svg';
import WalletOffLogo from 'assets/svgs/hordesOff.svg';
import WalletOnLogo from 'assets/svgs/hordesOn.svg';
import ProfileOffLogo from 'assets/svgs/profileOff.svg';
import ProfileOnLogo from 'assets/svgs/profileOn.svg';

export default function TabBar({ state, descriptors, navigation }) {

  /* states */
  const [tabBarVisible, setTabBarVisible] = useState(true);

  /* actions */
  const onTabBarButtonPress = (route, isFocused) => {
    if( isFocused ) {
      DeviceEventEmitter.emit(`${route.name}Press`);
    }
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
    });
    if( !isFocused && !event.defaultPrevented ) {
      navigation.navigate(route.name);
    }
  }

  /* ui */
  const iconForRoute = (name, isFocused) => {
    switch (name) {
      case 'Settings':
        return isFocused ? <SettingsOnLogo /> : <SettingsOffLogo />
      case 'Gifts':
        return isFocused ? <GiftsOnLogo /> : <GiftsOffLogo />
      case 'Wallet':
        return isFocused ? <WalletOnLogo /> : <WalletOffLogo />
      case 'Profile':
        return isFocused ? <ProfileOnLogo /> : <ProfileOffLogo />
    }
  }

  if( tabBarVisible == false ) return null;
  return (
    <View className='w-full bg-white'>
      <View className='w-full flex-row border-t border-t-light-gray'>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          return (
            <Button key={index} className={`flex-1 h-14 items-center ${isFocused ? 'justify-end' : 'justify-center'}`} onPress={() => onTabBarButtonPress(route, isFocused)}>
              <View className={`w-6 h-6 items-center justify-center`}>{iconForRoute(options.tabBarName, isFocused)}</View>
              {isFocused ? <Text className='font-gilroy-bold text-drak-gray text-xs uppercase tracking-widest mt-1'>{options.tabBarLabel}</Text> : null}
            </Button>
          )
        })}
      </View>
      {Platform.OS === 'ios' ? <CustomSafeAreaView insets={['bottom']} /> : <View className='h-[10]' />}
    </View>
  )

}
