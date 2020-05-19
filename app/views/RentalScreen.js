import React, {Component} from 'react';
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  AsyncStorage,
} from 'react-native';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Caption,
  Text,
  Row,
  Image,
  Icon,
  Button,
  Divider,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import moment from 'moment';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'RentalScreen: ';

export class RentalScreen extends Component {
  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    this.onUserProfileSnapshot = null;
    this.onRentalRequestSnapshot = null;
    this.onRentalRequestChanges = null;

    this.state = {
      refreshing: false,
      rentalRequests: null,
      userProfile: null,
    };

    this._refresh = this._refresh.bind(this);
  }

  componentDidMount() {
    this._getUserProfile();
    this._fetchRentalRequests();
    this._listenForRentalRequestChanges();
  }

  _getUserProfile() {
    const TAG = 'getUserProfile: ';
    console.log(SCREEN, TAG, 'start... ');

    const currentUser = AUTH.currentUser;

    this.onUserProfileSnapshot = DATABASE.collection('Users')
      .doc(currentUser.uid)
      .onSnapshot(doc => {
        if (doc.exists) {
          console.log(SCREEN + TAG + 'doc = ', doc);
          this.setState({userProfile: doc});
        } else {
          console.error(SCREEN + TAG + 'Doc is not exist...');
        }
        console.log(SCREEN, TAG, 'finish... ');
      });
  }

  _fetchRentalRequests() {
    const currentUser = AUTH.currentUser;

    const RentalRequestRef = DATABASE.collection('RentalRequest');
    this.onRentalRequestSnapshot = RentalRequestRef.where(
      'stylistUid',
      '==',
      currentUser.uid,
    )
      .where('status', '==', false)
      .onSnapshot(async querySnapshot => {
        const TAG = 'onRentalRequestSnapshot: ';
        console.log(SCREEN, TAG, 'start... ');
        console.log(SCREEN, TAG, 'querySnapshot = ', querySnapshot);

        const requests = [];
        for (const RentalRequest of querySnapshot.docs) {
          console.log(SCREEN, TAG, 'RentalRequest = ', RentalRequest);

          const UserRef = DATABASE.collection('Users');
          try {
            var customer = await UserRef.doc(RentalRequest.id).get();
            console.log(SCREEN, TAG, 'customer = ', customer);
          } catch (e) {
            // statements
            console.log(SCREEN, TAG, 'customer: error', e);
          }

          const {userProfile} = this.state;

          requests.push({
            id: RentalRequest.id,
            customer: {...customer.data()},
            stylist: {...userProfile.data()},
            ...RentalRequest.data(),
          });
        }

        console.log(SCREEN, TAG, 'requests = ', requests);

        this.setState({
          refreshing: false,
          rentalRequests: requests,
        });

        console.log(SCREEN, TAG, 'finish... ');
      });
  }

  _listenForRentalRequestChanges() {
    const currentUser = AUTH.currentUser;

    const RentalRequestRef = DATABASE.collection('RentalRequest');
    this.onRentalRequestChanges = RentalRequestRef.where(
      'stylistUid',
      '==',
      currentUser.uid,
    )
      .where('status', '==', false)
      .onSnapshot(async querySnapshot => {
        const TAG = 'onRentalRequestChanges: ';
        console.log(SCREEN, TAG, 'start... ');

        for (const docChange of querySnapshot.docChanges) {
          console.log(SCREEN, TAG, 'docChange = ', docChange);
          const {customer} = docChange.doc.data();

          try {
            var isSent = await AsyncStorage.getItem(docChange.doc.id);
          } catch (e) {
            // statements
            console.error(SCREEN, TAG, 'AsyncStorage.getItem: error...', e);
          }

          try {
            var isSelfAction = await AsyncStorage.getItem('isSelfAction');
          } catch (e) {
            // statements
            console.error(SCREEN, TAG, 'AsyncStorage.getItem: error...', e);
          }

          switch (docChange.type) {
            case 'added':
              console.log(SCREEN, TAG, 'isSent = ', isSent);

              if (isSent === null || isSent === undefined) {
                const title = 'Heads Up !';
                const body = 'You have a new Rental Request';

                const notification = new firebase.notifications.Notification()
                  .setNotificationId('1')
                  .setTitle(title)
                  .setBody(body)
                  .android.setChannelId('Main')
                  .android.setAutoCancel(true);

                NOTIFICATIONS.displayNotification(notification);

                try {
                  await AsyncStorage.setItem(docChange.doc.id, 'true');
                } catch (e) {
                  // statements
                  console.error(
                    SCREEN,
                    TAG,
                    'AsyncStorage.setItem: error...',
                    e,
                  );
                }
              }
              break;
            case 'removed':
              console.log(SCREEN, TAG, 'isSelfAction = ', isSelfAction);

              if (isSelfAction && isSelfAction === 'true') {
                try {
                  await AsyncStorage.removeItem('isSelfAction');
                } catch (e) {
                  console.error(
                    SCREEN,
                    TAG,
                    'AsyncStorage.removeItem: error...',
                    e,
                  );
                }
              } else {
                const title = 'Ouch !';
                const body = `${customer.profile.firstName} ${
                  customer.profile.lastName
                } has cancelled his Rental Request`;

                const notification = new firebase.notifications.Notification()
                  .setNotificationId('1')
                  .setTitle(title)
                  .setBody(body)
                  .android.setChannelId('Main')
                  .android.setAutoCancel(true);

                NOTIFICATIONS.displayNotification(notification);
              }

              try {
                await AsyncStorage.removeItem(docChange.doc.id);
              } catch (e) {
                // statements
                console.error(
                  SCREEN,
                  TAG,
                  'AsyncStorage.removeItem: error...',
                  e,
                );
              }
              break;
            default:
              // statements_def
              break;
          }
        }

        console.log(SCREEN, TAG, 'finish... ');
      });
  }

  _refresh() {
    const TAG = 'refresh: ';
    console.log(SCREEN, TAG, 'start...');

    this.setState({
      refreshing: true,
    });

    this._fetchRentalRequests();
  }

  componentWillUnmount() {
    const TAG = 'componentWillUnmount: ';
    console.log(SCREEN, TAG, 'start...');

    if (this.onUserProfileSnapshot) {
      console.log(
        SCREEN,
        TAG,
        'onUserProfileSnapshot = ',
        this.onUserProfileSnapshot,
      );

      this.onUserProfileSnapshot();
    }

    if (this.onRentalRequestSnapshot) {
      console.log(
        SCREEN,
        TAG,
        'onRentalRequestSnapshot = ',
        this.onRentalRequestSnapshot,
      );

      this.onRentalRequestSnapshot();
    }

    if (this.onRentalRequestChanges) {
      console.log(
        SCREEN,
        TAG,
        'onRentalRequestChanges = ',
        this.onRentalRequestChanges,
      );

      this.onRentalRequestChanges();
    }
  }

  render() {
    const refreshing = this.state.refreshing;
    const rentalRequests = this.state.rentalRequests;

    return (
      <Screen>
        <StatusBar
          backgroundColor={Colors.Misty_Rose}
          barStyle="dark-content"
          animated={true}
        />

        <View style={{flex: 1, backgroundColor: 'white'}}>
          {!rentalRequests && (
            <View styleName="flexible stretch vertical v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="horizontal h-center sm-gutter-top">
                LOADING...
              </Caption>
            </View>
          )}

          {rentalRequests && rentalRequests.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                SORRY... YOU HAVE NO BOOKING REQUEST YET...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  this.setState({
                    rentalRequests: null,
                  });

                  this._refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {rentalRequests && rentalRequests.length > 0 && (
            <FlatList
              contentContainerStyle={{
                paddingTop: 5,
                paddingBottom: 45,
                paddingHorizontal: 5,
              }}
              data={rentalRequests}
              refreshControl={
                <RefreshControl
                  //refresh control used for the Pull to Refresh
                  refreshing={refreshing}
                  onRefresh={this._refresh}
                />
              }
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <Row
                  key={item.id}
                  style={{elevation: 3, marginBottom: 5, padding: 10}}>
                  <Image
                    style={{
                      backgroundColor: '#f2f2f2',
                      marginRight: 10,
                    }}
                    styleName="small rounded-corners top"
                    source={{
                      uri: item.customer.profile.profilePic,
                    }}
                  />
                  <View styleName="vertical stretch space-between">
                    <View styleName="stretch sm-gutter-top md-gutter-bottom horizontal v-start space-between">
                      <View styleName="vertical stretch v-center">
                        <Title>{`${item.customer.profile.firstName} ${
                          item.customer.profile.lastName
                        }`}</Title>
                        <Caption>{`${item.customer.email}`}</Caption>
                      </View>

                      <Caption>
                        {`Created ${moment(
                          item.createdDatetime.toDate(),
                        ).fromNow()}`}
                      </Caption>
                    </View>

                    <View styleName="stretch sm-gutter-bottom">
                      <Caption style={{color: Colors.Dark}}>Item:</Caption>
                      <View styleName="stretch">
                        <Divider styleName="line" />
                        <View
                          style={{backgroundColor: '#f2f2f2'}}
                          styleName="sm-gutter horizontal v-center space-between">
                          <View styleName="flexible">
                            <Caption style={{color: Colors.Dark}}>
                              {item.itemName}
                            </Caption>
                          </View>
                          <View styleName="flexible horizontal h-end">
                            <Caption style={{color: Colors.Dark}}>
                              {item.variant.variantName}
                            </Caption>
                          </View>
                        </View>
                        <Divider styleName="line" />
                      </View>
                    </View>

                    <View styleName="stretch md-gutter-bottom">
                      <Caption style={{color: Colors.Dark}}>Variant:</Caption>
                      <View
                        style={{backgroundColor: Colors.Misty_Rose}}
                        styleName="stretch">
                        <Divider styleName="line" />
                        <View styleName="sm-gutter horizontal v-center space-between">
                          <View styleName="flexible">
                            <Caption style={{color: 'red'}}>
                              RM {item.variant.price.toFixed(2)} / day
                            </Caption>
                          </View>
                          <View styleName="flexible horizontal h-end">
                            <Caption style={{color: 'red'}}>
                              Rent: {item.rentalPeriod} day(s)
                            </Caption>
                          </View>
                        </View>
                        <Divider styleName="line" />
                      </View>
                    </View>

                    <View styleName="horizontal h-end">
                      <Button styleName="tight clear" onPress={() => {}}>
                        <Text>View Details</Text>
                        <Icon name="right-arrow" />
                      </Button>
                    </View>
                  </View>
                </Row>
              )}
            />
          )}
        </View>
      </Screen>
    );
  }
}
