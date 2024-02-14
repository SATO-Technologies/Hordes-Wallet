/* modules */
import { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';

/* components */
import Button from 'components/Button';

/* contexts */
import { useMempool } from 'contexts/mempool';

export default function FeeRate({ title, value, onSelect }) {

  /* mempool context */
  const { satsPerVbyte } = useMempool();

  /* ui */
  return (
    <View className='w-full'>
      <Text className='font-gilroy text-dark-gray text-lg'>{title}</Text>
      <View className='w-full flex-row overflow-hidden mt-2'>
        <Button className={`flex-1 py-2 border border-light-gray rounded-lg ${value != 'hourFee' ? 'bg-white' : 'bg-light-gray'}`} onPress={() => onSelect('hourFee')}>
          <View className='w-full items-center'>
            <Text className='font-gilroy-bold text-black text-sm'>Economy</Text>
            <Text className='font-gilroy text-black text-xs mt-2'>{satsPerVbyte['hourFee']} sats/vB</Text>
            <Text className='font-gilroy text-dark-gray text-xs'>~ one hour</Text>
          </View>
        </Button>
        <View className='w-2' />
        <Button className={`flex-1 py-2 border border-light-gray rounded-lg ${value != 'halfHourFee' ? 'bg-white' : 'bg-light-gray'}`} onPress={() => onSelect('halfHourFee')}>
          <View className='w-full items-center'>
            <Text className='font-gilroy-bold text-black text-sm'>Normal</Text>
            <Text className='font-gilroy text-black text-xs mt-2'>{satsPerVbyte['halfHourFee']} sats/vB</Text>
            <Text className='font-gilroy text-dark-gray text-xs'>~ half an hour</Text>
          </View>
        </Button>
        <View className='w-2' />
        <Button className={`flex-1 py-2 border border-light-gray rounded-lg ${value != 'fastestFee' ? 'bg-white' : 'bg-light-gray'}`} onPress={() => onSelect('fastestFee')}>
          <View className='w-full items-center'>
            <Text className='font-gilroy-bold text-black text-sm'>Fast</Text>
            <Text className='font-gilroy text-black text-xs mt-2'>{satsPerVbyte['fastestFee']} sats/vB</Text>
            <Text className='font-gilroy text-dark-gray text-xs'>~ in minutes</Text>
          </View>
        </Button>
      </View>
    </View>
  )

}
