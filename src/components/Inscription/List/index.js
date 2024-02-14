/* modules */
import { useNavigation } from '@react-navigation/native';
import { View, Text, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';

/* components */
import Button from 'components/Button';
import InscriptionPreview from 'components/Inscription/Preview';

/* utils */
import { numberFormat } from 'utils/number';

export default function InscriptionsList({ inscriptions, onPress }) {

  /* ui */
  return (
    <View className='w-full flex-row flex-wrap justify-between mt-4'>
      <View className='w-[48%]'>
        {inscriptions.map((inscription, index) => {
          if( (index%2) != 0 ) return null;
          return <Inscription key={index} inscription={inscription} onPress={onPress} />
        })}
      </View>
      <View className='w-[48%]'>
        {inscriptions.map((inscription, index) => {
          if( (index%2) == 0 ) return null;
          return <Inscription key={index} inscription={inscription} onPress={onPress} />
        })}
      </View>
    </View>
  )

}

export function Inscription({ inscription, onPress }) {

  /* navigation */
  let navigation = useNavigation();

  /* ui */
  return (
    <Button className='w-full rounded-lg mb-4' onPress={onPress ? () => onPress(inscription) : () => navigation.push('Inscription', { inscription: inscription })}>
      <View className='w-full aspect-square rounded-lg overflow-hidden'>
        <InscriptionPreview key={`inscription-list-${inscription.id}`} inscriptionId={inscription.id} type={inscription.content_type} textSize='text-sm' />
        {inscription.meta?.name
          ?
            <View className='absolute bottom-0 w-full h-8 items-center justify-center overflow-hidden'>
              {Platform.OS === 'ios'
                ?
                  <BlurView style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }} blurType='light' blurAmount={5} reducedTransparencyFallbackColor='white'>
                    <Text numberOfLines={1} adjustsFontSizeToFit={false} className='font-bold text-white text-xs'>{inscription.meta.name}</Text>
                  </BlurView>
                :
                  <View className='w-full h-8 items-center justify-center' style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }} blurType='light' blurAmount={5} reducedTransparencyFallbackColor='white'>
                    <Text numberOfLines={1} adjustsFontSizeToFit={false} className='font-bold text-white text-xs'>{inscription.meta.name}</Text>
                  </View>
              }
            </View>
          :
            null
        }
      </View>
      <View className='w-full items-center mt-1'>
        <Text className='font-gilroy text-dark-gray text-sm'># {numberFormat(inscription.num)}</Text>
      </View>
    </Button>
  )

}
