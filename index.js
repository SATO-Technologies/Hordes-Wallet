import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import './shim';

import * as bitcoin from 'bitcoinjs-lib';
import { ecc } from 'managers/ecc.tsx';
bitcoin.initEccLib(ecc);

/* globals */
global.network = 'bitcoin';
global.app = 'HORDES_WALLET_APP';
global.access_token = null;

/* modules */
import { AppRegistry, Text, TouchableOpacity } from 'react-native';

/* containers */
import NavigationController from 'containers/NavigationController';

/* basic config */
import { name as appName } from './app.json';

/* components default props */
Text.defaultProps = {
  ...Text.defaultProps,
  allowFontScaling: false,
  adjustsFontSizeToFit: true
};

TouchableOpacity.defaultProps = {
  ...TouchableOpacity.defaultProps,
  activeOpacity: 0.8
};

AppRegistry.registerComponent(appName, () => NavigationController);
