/**
 * Webview
 */

import React, { useState, useEffect, useLayoutEffect, useContext, useRef } from 'react';
import { View, Dimensions, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

/* components */
import Button from 'components/Button';

/* contexts */
import { useWallet } from 'contexts/wallet';
import { useModals } from 'contexts/modals';

/* libs */
import injectHordesPlugin from 'libs/hordes';

/* assets */
import BackLogo from 'assets/svgs/arrow.svg';
import ReloadLogo from 'assets/svgs/reload.svg';

const Browser = ({ navigation, route: { params: { title, url }} }) => {

  /* refs */
  const alreadyInjected = useRef(false);
  const webviewRef = useRef(null);

  /* wallet context */
  const { address, publicKey } = useWallet();

  /* modals context */
  const { showModal } = useModals();

  /* states */
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  /* screen states */
  useLayoutEffect(() => {

    /* navigation options */
    navigation.setOptions({
      headerTitle: '',
      headerLargeTitle: false,
      headerBackTitleVisible: false,
      headerRight: () => (
        <View className='flex-row items-center justify-start'>
          <Button className='w-8 h-8 items-center justify-center' onPress={canGoBack ? () => webviewRef.current.goBack() : null}><View className='w-6 h-6' style={{ opacity: canGoBack ? 1 : 0.2 }}><BackLogo /></View></Button>
          <Button className='w-8 h-8 items-center justify-center ml-2' onPress={canGoForward ? () => webviewRef.current.goForward() : null}><View className='w-6 h-6' style={{ transform: [{ rotate: '180deg' }], opacity: canGoForward ? 1 : 0.2 }}><BackLogo /></View></Button>
          <Button className='w-8 h-8 items-end justify-center ml-2' onPress={() => webviewRef.current.reload()}><View className='w-6 h-6'><ReloadLogo /></View></Button>
        </View>
      )
    });

  }, [canGoBack, canGoForward]);

  /* data */
  const onMessage = async (e) => {
    try {

      let json = JSON.parse(e.nativeEvent.data);
      let { request, params } = json;

      function executeResponse(id, payload) {
        webviewRef.current?.injectJavaScript("document.dispatchEvent(new CustomEvent('message', { detail: '" + JSON.stringify({
          id: id,
          response: payload
        }) + "' }) );");
      }

      switch (request) {
        case 'connect':
          showModal('HORDES_ADDRESS', {
            data: params,
            onData: (payload) => {
              executeResponse(json.id, payload);
            }
          });
          break
        case 'signMessage':
          showModal('HORDES_SIGN_MESSAGE', {
            data: params,
            onData: (payload) => {
              executeResponse(json.id, payload);
            }
          });
          break;
        case 'signTransaction':
          showModal('HORDES_SIGN_TRANSACTION', {
            data: params,
            onData: (payload) => {
              executeResponse(json.id, payload);
            }
          });
          break;
      }

    } catch {

    }
  }

  /* ui */
  return (
    <WebView ref={webviewRef} source={{ uri: url }} className='w-full h-full' onMessage={onMessage} onLoadStart={() => alreadyInjected.current = false} onLoadEnd={(e) => {
      if( alreadyInjected.current == false ) {
        webviewRef.current?.injectJavaScript(injectHordesPlugin);
        alreadyInjected.current = true;
      }
    }} onNavigationStateChange={(navState) => {
      setCanGoBack(navState.canGoBack);
      setCanGoForward(navState.canGoForward);
    }} />
  );

}

export default Browser;
