/* modules */
import { SafeAreaView, Dimensions, Platform, StatusBar } from 'react-native';

export default function CustomSafeAreaView({ cn, style = {}, insets = ['top', 'bottom'], children }) {

  /* ui */
  const navbarHeight = StatusBar.currentHeight > 24 ? Dimensions.get('screen').height - Dimensions.get('window').height : 20;
  const androidPadding = StatusBar.currentHeight > 24 ? 24 : 0
  return (
    <SafeAreaView className={cn} style={{ ...{ paddingTop: Platform.OS === 'android' ? insets.includes('top') ? StatusBar.currentHeight : 0 : 0, paddingBottom: Platform.OS === 'android' ? insets.includes('bottom-w-nav') ? (navbarHeight + androidPadding) : insets.includes('bottom') ? androidPadding : 0 : 0 }, ...style }}>
      {children}
    </SafeAreaView>
  )

}
