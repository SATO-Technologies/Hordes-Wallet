/**
 * Alert
 */

import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

/* components */
import InscriptionPreview from 'components/Inscription/Preview';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useAccount } from 'contexts/account';
import { useWallet } from 'contexts/wallet';

/* utils */
import { numberFormat } from 'utils/number';
import { emptyString } from 'utils/string';

/* assets */
import HordesLogo from 'assets/svgs/hordesShare.svg';
import HordesQRLogo from 'assets/svgs/hordes.svg';

export default function ProfileShare() {

  /* localization */
  const { localize } = useLocalization();

  /* account context */
  const { account: { profile } } = useAccount();

  /* wallet context */
  const { address } = useWallet();

  /* ui */
  return (
    <View className='w-full items-center justify-center p-8 bg-light-gray'>
      <View className='w-full flex-row items-center'>
        <View className='flex-1'>
          <Text className='font-gilroy-bold text-black text-lg'>{localize('Share.ProfileTitleText')}</Text>
          <Text className='font-gilroy text-dark-gray text-sm'>{localize('Share.ProfileDescText')}</Text>
        </View>
        <View className='w-12 h-12 rounded-lg overflow-hidden'>
          {profile.icon ? <InscriptionPreview key={`profile-share-${profile.icon.id}`} inscriptionId={profile.icon.id} type={profile.icon.content_type} textSize='text-xs' /> : <HordesLogo />}
        </View>
      </View>
      <View className='items-center justify-center bg-white rounded-lg p-8 my-4'>
        <QRCode value={`https://www.hordeswallet.com/deeplink/profile/${address.ordinals}`} color='#68717b' size={(Dimensions.get('window').width) * 0.5} />
        <View className='absolute w-10 h-10 items-center justify-center bg-black rounded-full p-3'>
          <HordesQRLogo />
        </View>
        {!emptyString(profile.username)
          ?
            <View className='w-full items-center mt-2'>
              <Text className='font-gilroy-bold text-black text-base'>{profile.username}</Text>
            </View>
          :
            null
        }
      </View>
      <View className='w-full flex-row items-center justify-between'>
        <Text className='font-gilroy-bold text-black text-base mt-2'>hordeswallet<Text className='font-gilroy black'>.com</Text></Text>
        <Text className='font-gilroy text-black text-base mt-2'>For <Text className='font-gilroy-bold black'>iOS</Text> & <Text className='font-gilroy-bold black'>Android</Text></Text>
      </View>
    </View>
  );

}
