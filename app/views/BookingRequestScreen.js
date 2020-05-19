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

const SCREEN = 'BookingRequestScreen: ';

export class BookingRequestScreen extends Component {
  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    this.onUserProfileSnapshot = null;
    this.onBookingRequestSnapshot = null;
    this.onBookingRequestChanges = null;

    this.state = {
      refreshing: false,
      bookingRequests: null,
      userProfile: null,
    };

    this._refresh = this._refresh.bind(this);
  }

  componentDidMount() {
    this._getUserProfile();
    this._fetchBookingRequests();
    this._listenForBookingRequestChanges();
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

  _fetchBookingRequests() {
    const currentUser = AUTH.currentUser;

    const BookingRequestRef = DATABASE.collection('BookingRequest');
    this.onBookingRequestSnapshot = BookingRequestRef.where(
      'stylistUid',
      '==',
      currentUser.uid,
    )
      .where('status', '==', false)
      .onSnapshot(async querySnapshot => {
        const TAG = 'onBookingRequestSnapshot: ';
        console.log(SCREEN, TAG, 'start... ');
        console.log(SCREEN, TAG, 'querySnapshot = ', querySnapshot);

        const requests = [];
        for (const BookingRequest of querySnapshot.docs) {
          console.log(SCREEN, TAG, 'BookingRequest = ', BookingRequest);

          const UserRef = DATABASE.collection('Users');
          try {
            var customer = await UserRef.doc(BookingRequest.id).get();
            console.log(SCREEN, TAG, 'customer = ', customer);
          } catch (e) {
            // statements
            console.log(SCREEN, TAG, 'customer: error', e);
          }

          const {userProfile} = this.state;

          requests.push({
            id: BookingRequest.id,
            customer: {...customer.data()},
            stylist: {...userProfile.data()},
            ...BookingRequest.data(),
          });
        }

        console.log(SCREEN, TAG, 'requests = ', requests);

        this.setState({
          refreshing: false,
          bookingRequests: requests,
        });

        console.log(SCREEN, TAG, 'finish... ');
      });
  }

  _listenForBookingRequestChanges() {
    const currentUser = AUTH.currentUser;

    const BookingRequestRef = DATABASE.collection('BookingRequest');
    this.onBookingRequestChanges = BookingRequestRef.where(
      'stylistUid',
      '==',
      currentUser.uid,
    )
      .where('status', '==', false)
      .onSnapshot(async querySnapshot => {
        const TAG = 'onBookingRequestChanges: ';
        console.log(SCREEN, TAG, 'start... ');

        for (const docChange of querySnapshot.docChanges) {
          console.log(SCREEN, TAG, 'docChange = ', docChange);
          const {customer} = docChange.doc.data();

          const key = `Booking_${docChange.doc.id}`;

          try {
            var isSent = await AsyncStorage.getItem(key);
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
                const body = 'You have a new Booking Request';

                const notification = new firebase.notifications.Notification()
                  .setNotificationId('1')
                  .setTitle(title)
                  .setBody(body)
                  .android.setChannelId('Main')
                  .android.setAutoCancel(true);

                NOTIFICATIONS.displayNotification(notification);

                try {
                  await AsyncStorage.setItem(key, 'true');
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
                } has cancelled his Booking Request`;

                const notification = new firebase.notifications.Notification()
                  .setNotificationId('1')
                  .setTitle(title)
                  .setBody(body)
                  .android.setChannelId('Main')
                  .android.setAutoCancel(true);

                NOTIFICATIONS.displayNotification(notification);
              }

              try {
                await AsyncStorage.removeItem(key);
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

    this._fetchBookingRequests();
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

    if (this.onBookingRequestSnapshot) {
      console.log(
        SCREEN,
        TAG,
        'onBookingRequestSnapshot = ',
        this.onBookingRequestSnapshot,
      );

      this.onBookingRequestSnapshot();
    }

    if (this.onBookingRequestChanges) {
      console.log(
        SCREEN,
        TAG,
        'onBookingRequestChanges = ',
        this.onBookingRequestChanges,
      );

      this.onBookingRequestChanges();
    }
  }

  render() {
    const refreshing = this.state.refreshing;
    const bookingRequests = this.state.bookingRequests;

    return (
      <Screen>
        <StatusBar
          backgroundColor={Colors.Misty_Rose}
          barStyle="dark-content"
          animated={true}
        />

        <View style={{flex: 1, backgroundColor: 'white'}}>
          {!bookingRequests && (
            <View styleName="flexible stretch vertical v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="horizontal h-center sm-gutter-top">
                LOADING...
              </Caption>
            </View>
          )}

          {bookingRequests && bookingRequests.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                SORRY... YOU HAVE NO BOOKING REQUEST YET...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  this.setState({
                    bookingRequests: null,
                  });

                  this._refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {bookingRequests && bookingRequests.length > 0 && (
            <FlatList
              contentContainerStyle={{
                paddingTop: 5,
                paddingBottom: 45,
                paddingHorizontal: 5,
              }}
              data={bookingRequests}
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
                      <Caption style={{color: Colors.Dark}}>
                        Booking On:
                      </Caption>
                      <View styleName="stretch">
                        <Divider styleName="line" />
                        <View
                          style={{backgroundColor: Colors.Misty_Rose}}
                          styleName="sm-gutter horizontal space-between">
                          <View styleName="flexible">
                            <Caption style={{color: Colors.Dark}}>
                              {moment(item.bookingDatetime.toDate()).format(
                                'ddd, MMMM D',
                              )}
                            </Caption>
                          </View>
                          <View styleName="flexible horizontal h-end">
                            <Caption style={{color: 'red'}}>
                              {moment(item.timeslot).format('hh:mm A')}
                            </Caption>
                          </View>
                        </View>
                        <Divider styleName="line" />
                      </View>
                    </View>

                    <View styleName="stretch md-gutter-bottom">
                      <Caption style={{color: Colors.Dark}}>Services:</Caption>
                      <View
                        style={{backgroundColor: '#f2f2f2'}}
                        styleName="stretch">
                        <Divider styleName="line" />
                        <View styleName="sm-gutter horizontal v-center space-between">
                          <View styleName="flexible">
                            <Caption style={{color: Colors.Dark}}>
                              {item.serviceItem.serviceName}
                            </Caption>
                          </View>
                          <View styleName="flexible horizontal h-center">
                            <Caption>{item.serviceTypeName}</Caption>
                          </View>
                          <View styleName="flexible horizontal h-end">
                            <Caption style={{color: 'red'}}>
                              RM {item.serviceItem.price.toFixed(2)}
                            </Caption>
                          </View>
                        </View>
                        <Divider styleName="line" />
                      </View>
                    </View>

                    <View styleName="horizontal h-end">
                      <Button
                        styleName="tight clear"
                        onPress={() => {
                          this.props.navigation.navigate(
                            'BookingDetailScreen',
                            {
                              bookingRequestUid: item.id,
                              ...item,
                            },
                          );
                        }}>
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

