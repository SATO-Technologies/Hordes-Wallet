/* modules */
import { View, Image, Dimensions, Platform } from 'react-native';

/* assets */
import IOSBackgroundImage from 'assets/images/splash_ios.png';
import AndroidBackgroundImage from 'assets/images/splash_ios.png';

export default function Splash() {

  /* ui */
  return (
    <View className='flex-1 items-center justify-start bg-black'>
      <Image source={Platform.OS === 'ios' ? IOSBackgroundImage : AndroidBackgroundImage} resizeMode={Platform.OS === 'ios' ? 'contain' : 'cover'} style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }} />
    </View>
  );

}
