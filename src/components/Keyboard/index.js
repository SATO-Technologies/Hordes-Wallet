/* modules */
import { View, Text } from 'react-native';

/* components */
import Button from 'components/Button';

/* utils */
import { emptyString } from 'utils/string';

/* assets */
import DeleteLogo from 'assets/svgs/delete.svg';

export default function Keyboard({ onPress }) {

  /* ui */
  const drawKeyboardNumber = ({ text, onPress }) => {
    return (
      <Button delay={0} className='flex-1 h-12 rounded-lg items-center justify-center' style={{ backgroundColor: emptyString(text) ? 'transparent' : '#eaeaea' }} onPress={() => onPress ? onPress(`${text}`) : null}>
        {text == '<' ? <DeleteLogo width={25} height={25} /> : <Text className='font-gilroy-bold text-black text-lg'>{text}</Text>}
      </Button>
    )
  }

  return (
    <View className='w-full'>
      <View className='w-full flex-row'>
        {drawKeyboardNumber({ text: 1, onPress: onPress })}
        <View className='w-2' />
        {drawKeyboardNumber({ text: 2, onPress: onPress })}
        <View className='w-2' />
        {drawKeyboardNumber({ text: 3, onPress: onPress })}
      </View>
      <View className='w-full flex-row mt-2'>
        {drawKeyboardNumber({ text: 4, onPress: onPress })}
        <View className='w-2' />
        {drawKeyboardNumber({ text: 5, onPress: onPress })}
        <View className='w-2' />
        {drawKeyboardNumber({ text: 6, onPress: onPress })}
      </View>
      <View className='w-full flex-row mt-2'>
        {drawKeyboardNumber({ text: 7, onPress: onPress })}
        <View className='w-2' />
        {drawKeyboardNumber({ text: 8, onPress: onPress })}
        <View className='w-2' />
        {drawKeyboardNumber({ text: 9, onPress: onPress })}
      </View>
      <View className='w-full flex-row mt-2'>
        {drawKeyboardNumber({ text: '', onPress: onPress })}
        <View className='w-2' />
        {drawKeyboardNumber({ text: 0, onPress: onPress })}
        <View className='w-2' />
        {drawKeyboardNumber({ text: '<', onPress: onPress })}
      </View>
    </View>
  )

}
