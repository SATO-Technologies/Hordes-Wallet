/* modules */
import { useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';

const Button = (props) => {

  /* refs */
  let isPressed = useRef(false);

  /* ui */
  const onPress = () => {
    if( isPressed.current == true ) return;
    isPressed.current = true;
    if( props.onPress ) {
      props.onPress();
    }
    if( props.delay == 0 ) {
      isPressed.current = false;
    } else {
      setTimeout(() => {
        isPressed.current = false;
      }, props.delay || 500);
    }
  }

  if( props.onPress == null ) {
    return (
      <View {...props}>
        {props.children}
      </View>
    )
  }
  return (
    <TouchableOpacity {...props} onPress={onPress}>
      {props.children}
    </TouchableOpacity>
  )

}

export default Button;
