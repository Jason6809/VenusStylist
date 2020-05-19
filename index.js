/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import BgMessaging from './app/services/BgMessaging';

console.disableYellowBox = true;

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask(
  'RNFirebaseBackgroundMessage',
  () => BgMessaging,
);
