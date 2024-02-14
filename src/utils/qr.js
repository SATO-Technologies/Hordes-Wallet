/* modules */
import { Linking } from 'react-native';

export const parseInput = (url) => {
  let bitcoinRequest = parseBitcoinUrl(url);
  if( bitcoinRequest && bitcoinRequest.address ) return bitcoinRequest;

  let hordesRequest = parseHordesUrl(url);
  if( hordesRequest && hordesRequest.action ) return hordesRequest;

  if( Linking.canOpenURL(url) ) {
    if( url.includes('deeplink/profile/') ) {
      return {
        type: 'hordesRequest',
        action: 'profile',
        params: {
          address: url.split('deeplink/profile/')[1]
        }
      }
    }
    return {
      type: 'url',
      url: url
    }
  }

  return null;
}

const parseBitcoinUrl = (url = '') => {
  if( !url.includes('bitcoin:') ) url = `bitcoin:${url}`;
  const regex = /^bitcoin:([a-zA-Z0-9]*)(\?amount=([\d.]+))?(\&?message=([^\&]+))?$/;
  const matches = url.match(regex);
  if( !matches ) return null;
  const address = matches[1];
  const amount = matches[3] ? parseFloat(matches[3]) : '0';
  const message = matches[5] || '';
  return {
    type: 'bitcoinAddress',
    address: address,
    amount: amount,
    message: message
  }
}

const parseHordesUrl = (url) => {
  if( !url.includes('hordes:') ) url = `hordes:${url}`;
  const urlObject = new URL(url);
  const paramsString = urlObject.searchParams.get('params');
  let paramsObject = { };
  try {
    paramsObject = JSON.parse(paramsString);
  } catch (error) { }
  return {
    type: 'hordesRequest',
    action: urlObject.searchParams.get('action'),
    params: paramsObject
  };
}
