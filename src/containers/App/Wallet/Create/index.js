/* modules */
import { Fragment, useLayoutEffect } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import * as bip39 from 'bip39';

/* components */
import CustomSafeAreaView from 'components/SafeAreaView';
import Button from 'components/Button';

/* contexts */
import { useLocalization } from 'contexts/localization';
import { useModals } from 'contexts/modals';

export default function WalletCreate({ navigation }) {

  /* localization */
  const { localize } = useLocalization();

  /* modals context */
  const { showModal } = useModals();

  /* effects */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: (props) => <Text {...props} className='font-gilroy-bold text-black text-base uppercase tracking-widest'>{localize('WalletCreate.HeaderText')}</Text>,
      headerLargeTitle: false
    });

  }, []);

  /* actions */
  const onCreateButtonPress = () => {
    showModal('WALLET_SECRET_PHRASE', {
      onChoose: async (length) => {
        if( length == null ) return;
        navigation.push('WalletCreatePasscode', {
          mnemonic: await bip39.generateMnemonic(length)
        });
      }
    })
  }

  const onImportButtonPress = () => {
    navigation.push('WalletCreateImport');
  }

  /* ui */
  return (
    <Fragment>
      <CustomSafeAreaView cn='flex-1 items-center justify-start bg-white' insets={['bottom']}>
        <View className='w-full flex-1 px-4 py-8'>
          <View className='w-full p-4 rounded-lg border border-light-gray'>
            <Text className='font-gilroy-bold text-black text-lg'>{localize('WalletCreate.TitleText')}</Text>
            <Text className='font-gilroy text-dark-gray text-sm'>{localize('WalletCreate.DescText')}</Text>
            <Button className='w-full h-12 items-center justify-center bg-black rounded-lg mt-6' onPress={onCreateButtonPress}>
              <Text className='font-gilroy-bold text-white uppercase tracking-widest'>{localize('WalletCreate.CreateSeedText')}</Text>
            </Button>
            <Button className='w-full h-12 items-center justify-center rounded-lg mt-4' onPress={onImportButtonPress}>
              <Text className='font-gilroy text-black uppercase tracking-widest'>{localize('WalletCreate.ImportSeedText1')} <Text className='font-gilroy-bold'>{localize('WalletCreate.ImportSeedText2')}</Text></Text>
            </Button>
          </View>
        </View>
      </CustomSafeAreaView>
    </Fragment>
  );

}
