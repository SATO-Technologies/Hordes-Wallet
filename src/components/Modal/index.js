/* modules */
import { useState, useEffect } from 'react';
import { View, Animated, Dimensions, Platform, StatusBar } from 'react-native';

export default function Modal({ show, animation = 'modal', pointerEvents = 'auto', children }) {

  /* states */
  const [top, setTop] = useState(new Animated.Value(Dimensions.get('window').height))
  const [opacity, setOpacity] = useState(new Animated.Value(0))

  /* screen states */
  useEffect(() => {
    if( animation == 'fade' ) {
      Animated.timing(opacity, {
        toValue: show == true ? 1 : 0,
        duration: 250,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(top, {
        toValue: show == true ? 0 : Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [show]);

  /* actions */

  /* ui */
  if( animation == 'fade' ) {
    return (
      <Animated.View pointerEvents={pointerEvents} style={[{ position: 'absolute', top: 0, left: 0, width: Dimensions.get('window').width, height: Platform.OS === 'android' && Platform.Version < 30 ? Dimensions.get('window').height - StatusBar.currentHeight : Dimensions.get('window').height, opacity: opacity }]}>
        {children}
      </Animated.View>
    )
  }
  return (
    <Animated.View pointerEvents={pointerEvents} style={[{ position: 'absolute', top: 0, left: 0, width: Dimensions.get('window').width, height: Platform.OS === 'android' && Platform.Version < 30 ? Dimensions.get('window').height - StatusBar.currentHeight : Dimensions.get('window').height, transform: [{ translateY: top }] }]}>
      {children}
    </Animated.View>
  )

}
