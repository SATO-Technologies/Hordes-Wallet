/* modules */
import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import moment from 'moment';

/* components */
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';

/* assets */
import ReloadLogo from 'assets/svgs/reload.svg';

export default function WalletSyncStatus({ transaction }) {

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { wallet, status, sync } = useWallet();

  /* animations */
  const spinValue = useRef(new Animated.Value(0)).current;

  /* effects */
  useEffect(() => {

    if( status == 'WALLET_SYNCING' ) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
    } else {
      spinValue.setValue(0)
    }

  }, [status]);

  /* actions */
  const onFetchButtonPress = async () => {
    await sync({ id: wallet.id });
  }

  /* ui */
  const rotate = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Button onPress={onFetchButtonPress}>
      <Animated.View className='w-6 h-6 items-center justify-center' style={{ transform: [{ rotate: rotate }] }}><ReloadLogo /></Animated.View>
    </Button>
  );

}
