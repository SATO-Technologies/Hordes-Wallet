/* modules */
import { useEffect, useContext } from 'react';
import { Linking, Platform } from 'react-native';

/* utils */
import { parseInput } from 'utils/qr';

const useDeepLink = ({ minimumDataReady, showModal }) => {

  /* screen states */
  useEffect(() => {

    if( minimumDataReady == false ) return;

    const onInput = async (input) => {
      if( input ) {
        switch(input.type) {
          case 'url':
            Linking.openURL(input.url);
            break;
          case 'bitcoinAddress':
            showModal('WALLET_SEND', {
              data: input
            });
            break;
          case 'hordesRequest':
            switch (input.action) {
              case 'profile':
                showModal('PROFILE', {
                  data: input.params
                });
                break;
              case 'address':
                showModal('HORDES_ADDRESS', {
                  data: input.params
                });
                break;
              case 'signMessage':
                showModal('HORDES_SIGN_MESSAGE', {
                  data: input.params
                });
                break;
              case 'signTransaction':
                showModal('HORDES_SIGN_TRANSACTION', {
                  data: input.params
                });
                break;
            }
            break;
        }
      }
    }

    async function doAsyncRequest() {
      let initialUrl = await Linking.getInitialURL();
      if( initialUrl ) onInput(parseInput(initialUrl));

      Linking.addEventListener('url', (initialUrl) => {
        if( initialUrl && initialUrl.url ) onInput(parseInput(initialUrl.url));
      });
    }
    doAsyncRequest();

  }, [minimumDataReady, showModal]);

}

export default useDeepLink
