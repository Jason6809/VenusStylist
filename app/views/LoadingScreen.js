import React, {Component} from 'react';
import {StatusBar} from 'react-native';

import {Screen, View, Text, Image} from '@shoutem/ui';

import Colors from '../constants/Colors';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'LoadingScreen: ';

export class LoadingScreen extends Component {
  constructor(props) {
    super(props);
    this.onAuthStateChanged = null;
  }

  componentDidMount() {
    this._createNotificationChannel();

    this.onAuthStateChanged = AUTH.onAuthStateChanged(firebaseUser => {
      const TAG = 'onAuthStateChanged: ';
      console.log(SCREEN, TAG, 'start... ');
      console.log(SCREEN, TAG, 'firebaseUser = ', firebaseUser);

      if (firebaseUser) {
        this._checkPermission(firebaseUser);
      }

      setTimeout(() => {
        this.props.navigation.navigate(firebaseUser ? 'App' : 'Auth');
      }, 2000);

      console.log(SCREEN, TAG, 'finish... ');
    });
  }

  async _checkPermission(firebaseUser) {
    const TAG = 'checkPermission: ';
    console.log(SCREEN, TAG, 'start... ');

    const enabled = await MESSAGING.hasPermission();
    if (enabled) {
      console.log(SCREEN, TAG, 'enabled = ', enabled);
      this._updateToken(firebaseUser);
    } else {
      console.log(SCREEN, TAG, 'enabled = ', enabled);
      this._requestPermission(firebaseUser);
    }
  }

  async _updateToken(firebaseUser) {
    const TAG = 'updateToken: ';
    console.log(SCREEN, TAG, 'start... ');

    var fcmToken = await MESSAGING.getToken();
    console.log(SCREEN, TAG, 'fcmToken = ', fcmToken);

    if (fcmToken && firebaseUser) {
      DATABASE.collection('UserStatus')
        .doc(firebaseUser.uid)
        .update({
          fcmToken,
        });
    }
  }

  async _requestPermission(firebaseUser) {
    const TAG = 'requestPermission: ';
    console.log(SCREEN, TAG, 'start... ');

    try {
      await MESSAGING.requestPermission();
      this._updateToken(firebaseUser);
    } catch (error) {
      // statements
      console.error(SCREEN, TAG, 'error = ', error);
    }
  }

  _createNotificationChannel() {
    // Build a android notification channel
    const channel = new firebase.notifications.Android.Channel(
      'Main', // channelId
      'Main Channel', // channel name
      firebase.notifications.Android.Importance.High, // channel importance
    ).setDescription('Used for getting Main notifications'); // channel description

    // Create the android notification channel
    NOTIFICATIONS.android.createChannel(channel);
  }

  componentWillUnmount() {
    const TAG = 'componentWillUnmount: ';
    console.log(SCREEN, TAG, 'start...');

    if (this.onAuthStateChanged) {
      console.log(
        SCREEN,
        TAG,
        'onAuthStateChanged = ',
        this.onAuthStateChanged,
      );

      this.onAuthStateChanged();
    }
  }

  render() {
    return (
      <Screen style={{backgroundColor: 'white'}}>
        <StatusBar
          backgroundColor="white"
          barStyle="dark-content"
          animated={true}
        />
        <View styleName="flexible stretch vertical v-center h-center">
          <Image source={require('../assets/loader_large.gif')} />
          <Text style={{color: Colors.Dark}} styleName="md-gutter-top">
            LOADING
          </Text>
        </View>
      </Screen>
    );
  }
}
