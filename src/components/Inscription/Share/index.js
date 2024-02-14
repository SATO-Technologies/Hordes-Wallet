/**
 * Alert
 */

import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

/* components */
import InscriptionPreview from '../Preview';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';

/* utils */
import { numberFormat } from 'utils/number';

/* assets */
import HordesLogo from 'assets/svgs/hordesShare.svg';
import HordesQRLogo from 'assets/svgs/hordes.svg';

export default function InscriptionShare({ inscription }) {

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { address } = useWallet();

  /* ui */
  return (
    <View className='w-full items-center justify-center p-8 bg-white'>
      <View className='w-full flex-row items-center border-b border-b-light-gray pb-8'>
        <View className='flex-1 items-start'>
          <Text className='font-gilroy-bold text-black text-lg'>{inscription.meta?.name || `${localize('Inscription.TitleText', [numberFormat(inscription.num)])}`}</Text>
          {inscription.meta?.name ? <Text className='font-gilroy text-black text-sm'>{localize('Inscription.TitleText', [numberFormat(inscription.num)])}</Text> : null}
        </View>
        {inscription.collection && inscription.collection.name ? <View className='flex-1 items-end'>
          <Text className='font-gilroy-bold text-black text-lg'>{localize('Collection.TitleText')}</Text>
          <Text className='font-gilroy text-black text-sm'>{inscription.collection.name}</Text>
        </View> : null}
      </View>
      <View className='w-full items-center mt-8 border-b border-b-light-gray pb-8'>
        <View className='w-[65%] aspect-square rounded-lg overflow-hidden bg-light-gray p-4'>
          <InscriptionPreview key={`inscription-share-${inscription.id}`} inscriptionId={inscription.id} type={inscription.content_type} resizeMode='contain' preview={true} />
        </View>
      </View>
      <View className='w-full flex-row mt-8'>
        <View className='flex-[0.3]'>
          <View className='w-16 h-16'><HordesLogo /></View>
          <Text className='font-gilroy-bold text-black text-lg'>{localize('Share.InscriptionTitleText')}</Text>
          <Text className='font-gilroy text-dark-gray text-xs'>{localize('Share.InscriptionDescText')}</Text>
          <Text className='font-gilroy-bold text-dark-gray text-base mt-2'>hordeswallet<Text className='font-gilroy text-dark-gray'>.com</Text></Text>
        </View>
        <View className='flex-[0.7] flex-row items-center'>
          <View className='flex-1 px-4'>
            <Text className='font-gilroy-bold text-black text-base'>{localize('Share.InscriptionConnectText')}</Text>
            <Text className='font-gilroy text-dark-gray text-sm'>{address.ordinals}</Text>
          </View>
          <View className='items-center justify-center rounded-lg bg-white p-4'>
            <QRCode value={`https://www.hordeswallet.com/deeplink/profile/${address.ordinals}`} color='#68717b' size={(Dimensions.get('window').width * 1.75) * 0.2} />
            <View className='absolute w-8 h-8 items-center justify-center bg-black rounded-full p-3'>
              <HordesQRLogo />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

}
