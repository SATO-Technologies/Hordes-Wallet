import React, { useState, useEffect, useContext, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { WebView } from 'react-native-webview';
import { BASE_API_ENDPOINT_ORDINALS } from '@env';

/* utils */
import { emptyString, containsHTML } from 'utils/string';

export default function InscriptionPreview({ inscriptionId, type: contentType, uri, width = '100%', height = '100%', brc20, resizeMode = 'cover', backgroundColor = '#eaeaea', textSize = 'text-base', preview = true }) {

  /* refs */
  const imageLoaderUrlRef = useRef(null);

  /* states */
  const [type, setType] = useState(contentType);
  const [text, setText] = useState(null);
  const [brc20Text, setBrc20Text] = useState(brc20);
  const [snsText, setSnsText] = useState(null);
  const [html, setHtml] = useState(null);
  const [bgColor, setBgColor] = useState(backgroundColor);
  const [imageLoaderUrl, setImageLoaderUrl] = useState('https://ord-mirror.magiceden.dev');
  const [showPreview, setShowPreview] = useState(preview);

  /* screen effects */
  useEffect(() => {

    const doAsyncRequest = async () => {
      if( type.includes('text/html') ) {
        setHtml(await fetch(`${imageLoaderUrl}/content/${inscriptionId}`).then((r) => r.text()));
      } else if( type.includes('text/plain') || type.includes('text/javascript') ) {
        let resText = await fetch(`https://ord-mirror.magiceden.dev/content/${inscriptionId}`).then((r) => r.text());
        try {
          let json = JSON.parse(resText);
          if( json ) {
            if( json.p == 'sns' && json.name ) {
              setSnsText(json.name);
              return;
            }
            if( json.p == 'brc-20' && json.tick ) {
              setBrc20Text(json.tick);
              return;
            }
          }
          setText(resText);
        } catch {
          let inscriptionContentType = await fetch(`https://renderer.magiceden.dev/v2/render?id=${inscriptionId}`, { method: 'HEAD' });
          if( inscriptionContentType.ok == false ) {
            setText(resText);
          }
        }
      }
    }
    if( inscriptionId && type ) doAsyncRequest();

  }, [inscriptionId, type]);

  useEffect(() => {
    if( inscriptionId && !type ) {
      const doAsyncRequest = async () => {
        let inscriptionContentType = await fetch(`https://ord-mirror.magiceden.dev/content/${inscriptionId}`, { method: 'HEAD' });
        if( inscriptionContentType.ok ) {
          inscriptionContentType = inscriptionContentType.headers.get('Content-type');
          setType(inscriptionContentType);
        }
      }
      doAsyncRequest();
    }
  }, [inscriptionId, type]);

  const onLoadError = () => {
    setShowPreview(false);
  }

  /* ui */
  if( !inscriptionId || !type ) {
    return <View style={{ width: width, height: height, backgroundColor: bgColor }} />
  }
  if( showPreview == true && type ) {
    return (
      <View style={{ width: width, height: height, backgroundColor: bgColor }}>
        <FastImage key='inscription-image-preview' resizeMode={resizeMode == 'contain' ? FastImage.resizeMode.contain : FastImage.resizeMode.cover} source={{ uri: `https://renderer.magiceden.dev/v2/render?id=${inscriptionId}` }} style={{ width: '100%', height: '100%' }} onError={onLoadError} />
      </View>
    )
  }
  if( type.includes('text/html') ) {
    if( html ) {
      return (
        <View style={{ width: width, height: height, backgroundColor: bgColor }}>
          <WebView style={{ width: width, height: height }} source={{ html: html, baseUrl: `${imageLoaderUrl}/` }} />
        </View>
      )
    }
    return null;
  } else if( type.includes('model/') ) {
    return (
      <View style={{ width: width, height: height, backgroundColor: bgColor }}>
        <WebView style={{ width: width, height: height }} source={{ uri: `${BASE_API_ENDPOINT_ORDINALS}/model.html?id=${inscriptionId}` }} />
      </View>
    )
  } else if( type.includes('image/svg') ) {
    return (
      <View style={{ width: width, height: height, backgroundColor: bgColor }}>
        <WebView style={{ width: width, height: height }} source={{ html: `<img src='${`${imageLoaderUrl}/content/${inscriptionId}`}' style="width: 100%; height: 100%;" />` }} />
      </View>
    )
  } else if( type.includes('image/') ) {
    return (
      <View style={{ width: width, height: height, backgroundColor: bgColor }}>
        <FastImage key='inscription-image' resizeMode={resizeMode == 'contain' ? FastImage.resizeMode.contain : FastImage.resizeMode.cover} source={{ uri: uri || `${imageLoaderUrl}/content/${inscriptionId}` }} style={{ width: '100%', height: '100%' }} />
      </View>
    )
  } else if( type.includes('text/plain') || type.includes('text/javascript') ) {
    if( brc20Text || snsText ) {
      return (
        <View className='items-center justify-center bg-black p-4' style={[{ width: width, height: height }]}>
          <Text className={`font-gilroy text-white ${textSize}`}>{brc20Text || snsText}</Text>
        </View>
      )
    }
    if( !emptyString(text) ) {
      if( showPreview ) {
        return (
          <View className='bg-black' style={{ width: width, height: height }}>
            <Text adjustsFontSizeToFit={false} className={`font-gilroy text-white ${textSize} p-2`}>{text}</Text>
          </View>
        )
      }
      return (
        <View className='bg-black' style={{ width: width, height: height }}>
          <ScrollView className={`w-full flex-1 ${textSize == 'text-xs' ? 'p-2' : 'px-4 py-2'}`} showsVerticalScrollIndicator={false}>
            <Text className={`font-gilroy text-white ${textSize}`}>{text}</Text>
          </ScrollView>
        </View>
      )
    }
    return (
      <View style={{ width: width, height: height, backgroundColor: bgColor }}>
        <FastImage  resizeMode={resizeMode == 'contain' ? FastImage.resizeMode.contain : FastImage.resizeMode.cover} source={{ uri: `https://renderer.magiceden.dev/v2/render?id=${inscriptionId}` }} style={{ width: '100%', height: '100%' }} />
      </View>
    )
  } else if( type.includes('audio/') ) {
    let audioHtml = `<div style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center;"><audio controls style='width: 100%; height=100%;'><source src='${`${imageLoaderUrl}/content/${inscriptionId}`}' type='${type}' /></audio></div>`
    return (
      <View style={{ width: width, height: height, backgroundColor: bgColor }}>
        <WebView style={{ width: width, height: height, backgroundColor: bgColor }} allowsInlineMediaPlayback={true} source={{ html: audioHtml }} />
      </View>
    )
  }  else if( type.includes('video/') ) {
    let videoHtml = `<video controls playsInline autoPlay src='${`${imageLoaderUrl}/content/${inscriptionId}`}' style='width: 100%; height: 100%; object-fit: contain;' />`
    return (
      <View style={{ width: width, height: height, backgroundColor: bgColor }}>
        <WebView style={{ width: width, height: height, backgroundColor: bgColor }} allowsInlineMediaPlayback={true} source={{ html: videoHtml }} />
      </View>
    )
  }

}
