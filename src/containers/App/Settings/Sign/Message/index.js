/* modules */
import { Fragment, useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Signer, Verifier } from 'bip322-js';
import * as bip39 from 'bip39';
import { bip32, ECPair } from 'managers/ecc.tsx';
import { jwtDecode } from 'jwt-decode';
import * as bitcoin from 'bitcoinjs-lib';
import Clipboard from '@react-native-clipboard/clipboard';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* managers */
import bip322 from 'managers/bip322';

/* utils */
import { emptyString, ellipsis } from 'utils/string';

/* assets */
import CopyLogo from 'assets/svgs/copy.svg';

export default function SignMessage({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* wallet context */
  const { wallet, address, buildDerivationPath, signPsbt } = useWallet();

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [processing, setProcessing] = useState(false);

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('Settings.SignMessageHeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* actions */
  const onSignButtonPress = async () => {
    setProcessing(true);

    showModal('PASSCODE_AUTHENTICATOR', {
      mnemonic: wallet.mnemonic,
      onSuccess: async (mnemonic) => {

        setTimeout(async () => {

          const seed = bip39.mnemonicToSeedSync(mnemonic);
          const node = bip32.fromSeed(seed);
          const wif = node.derivePath(buildDerivationPath(wallet.derivationPath)).toWIF();

          const bip322PsbtBase64 = bip322.signMessage({ wif: wif, address: address.ordinals, message: message });
          const bip322PsbtSigned = await signPsbt({ id: wallet.id, base64Psbt: bip322PsbtBase64 });

          const psbt = bitcoin.Psbt.fromBase64(bip322PsbtSigned);
          const witness = psbt.data.inputs[0].finalScriptWitness;
          if( witness ) {
            let signature = witness.toString('base64');
            setSignature(signature);
          }

          setProcessing(false);

        }, 300);

      }
    });

  }

  const onCopyButtonPress = () => {
    Clipboard.setString(signature);
    showModal('RESPONSE', {
      type: 'SUCCESS',
      message: localize('General.CopiedText')
    });
  }

  /* ui */
  return (
    <CustomSafeAreaView cn='w-full flex-1 bg-white' insets={[]}>
      <View className='w-full flex-1 px-4 pb-4'>
        <ScrollView className='w-full flex-1' showsVerticalScrollIndicator={false}>
          {emptyString(signature)
            ?
              <Fragment>
                <View className='w-full items-center'>
                  <View className='w-full border border-light-gray rounded-lg px-4 py-3 mt-4'>
                    <Text className='font-gilroy-bold text-black text-sm'>{localize('HordesPlugin.SignMessageContentText')}</Text>
                    <TextInput multiline={true} textAlignVertical='top' className='w-full h-[100] font-gilroy text-dark-gray text-sm' value={message} onChangeText={setMessage} placeholder={localize('Settings.SignMessageWriteHereText')} placeholderTextColor='#68717b' textAlign='left' autoCorrect={false} autoCapitalize='none' blurOnSubmit={true} />
                  </View>
                  <View className='w-full border border-light-gray rounded-lg px-4 py-3 mt-4'>
                    <Text className='font-gilroy-bold text-black text-sm'>{localize('HordesPlugin.SignMessageSigningAddressText')}</Text>
                    <View className='w-full flex-row items-center justify-between'>
                      <Text className='font-gilroy text-dark-gray text-sm mt-2'>{localize('HordesPlugin.SignMessageOrdinalsAddressText')}</Text>
                      <Text className='font-gilroy text-dark-gray text-sm mt-2'>{ellipsis(address.ordinals)}</Text>
                    </View>
                  </View>
                </View>
                <View className='w-full px-4 py-2 border border-light-gray rounded-lg mt-4'>
                  <Text className='font-gilroy text-black text-sm'>{localize('HordesPlugin.SignMessageNoteText1')}</Text>
                  <Text className='font-gilroy text-dark-gray text-xs mt-2'>{localize('HordesPlugin.SignMessageNoteText2')}</Text>
                </View>
              </Fragment>
            :
              <View className='w-full items-center'>
                <View className='w-full border border-light-gray rounded-lg px-4 py-3 mt-4'>
                  <View className='w-full flex-row items-center justify-between'>
                    <Text className='font-gilroy-bold text-black text-sm'>{localize('HordesPlugin.SignMessageSignatureText')}</Text>
                    <Button className='w-5 h-5' onPress={() => onCopyButtonPress('ORDINALS')}><CopyLogo /></Button>
                  </View>
                  <Text className='font-gilroy text-dark-gray text-sm mt-2'>{signature}</Text>
                </View>
              </View>
          }
        </ScrollView>
        {processing
          ?
            <View className='w-full h-12 items-center mt-4'>
              <ActivityIndicator size='large' />
            </View>
          :
            <Button className={`w-full h-12 items-center justify-center ${emptyString(message) ? 'bg-light-gray' : 'bg-black'} rounded-lg mt-4`} onPress={!emptyString(signature) ? () => { setMessage(''); setSignature(''); } : emptyString(message) ? null : onSignButtonPress}>
              <Text className='font-gilroy-bold text-white text-sm uppercase tracking-widest'>{localize(!emptyString(signature) ? 'HordesPlugin.SignMessageOtherText' : 'HordesPlugin.SignMessageApproveText')}</Text>
            </Button>
        }
      </View>
    </CustomSafeAreaView>
  )

}
