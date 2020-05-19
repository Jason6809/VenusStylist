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

const SCREEN = 'AppointmentHistoryScreen: ';

export class AppointmentHistoryScreen extends Component {
  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    this.onUserProfileSnapshot = null;
    this.onAppointmentHistorySnapshot = null;
    this.state = {
      loading: true,
      refreshing: false,
      appointments: null,
      userProfile: null,
    };

    this._refresh = this._refresh.bind(this);
  }

  componentDidMount() {
    this._getUserProfile();
    this._fetchAppointmentHistory();
  }

  _getUserProfile() {
    const TAG = 'getUserProfile: ';
    console.log(SCREEN, TAG, 'start... ');

    const currentUser = AUTH.currentUser;

    this.onUserProfileSnapshot = DATABASE.collection('Users')
      .doc(currentUser.uid)
      .onSnapshot(doc => {
        if (doc.exists) {
          console.log(SCREEN + TAG + 'doc = ', doc.data());
          this.setState({userProfile: doc});
        } else {
          console.error(SCREEN + TAG + 'Doc is not exist...');
        }
        console.log(SCREEN, TAG, 'finish... ');
      });
  }

  _fetchAppointmentHistory() {
    const currentUser = AUTH.currentUser;

    const BookingRequestRef = DATABASE.collection('AppointmentHistory');
    this.onAppointmentHistorySnapshot = BookingRequestRef.where(
      'stylistUid',
      '==',
      currentUser.uid,
    ).onSnapshot(async querySnapshot => {
      const TAG = 'onAppointmentHistorySnapshot: ';
      console.log(SCREEN, TAG, 'start... ');
      console.log(SCREEN, TAG, 'querySnapshot = ', querySnapshot);

      const appointments = [];
      for (const AppointmentHistory of querySnapshot.docs) {
        console.log(SCREEN, TAG, 'AppointmentHistory = ', AppointmentHistory);

        const {bookingRequestUid} = AppointmentHistory.data();

        const UserRef = DATABASE.collection('Users');
        try {
          var customer = await UserRef.doc(bookingRequestUid).get();
          console.log(SCREEN, TAG, 'customer = ', customer);
        } catch (e) {
          // statements
          console.error(SCREEN, TAG, 'customer: error', e);
        }

        const {userProfile} = this.state;

        AppointmentHistory.data().stylist = userProfile.data();
        AppointmentHistory.data().customer = customer.data();

        appointments.push({
          id: AppointmentHistory.id,
          ...AppointmentHistory.data(),
        });
      }

      console.log(SCREEN, TAG, 'appointments = ', appointments);

      this.setState({
        refreshing: false,
        appointments: appointments,
      });

      console.log(SCREEN, TAG, 'finish... ');
    });
  }

  _refresh() {
    const TAG = 'refresh: ';
    console.log(SCREEN, TAG, 'start...');

    this.setState({
      refreshing: true,
    });

    this._fetchAppointmentHistory();
  }

  componentWillUnmount() {
    const TAG = 'componentWillUnmount: ';
    console.log(SCREEN, TAG, 'start...');

    if (this.onAppointmentHistorySnapshot) {
      console.log(
        SCREEN,
        TAG,
        'onAppointmentHistorySnapshot = ',
        this.onAppointmentHistorySnapshot,
      );

      this.onAppointmentHistorySnapshot();
    }
  }

  render() {
    const refreshing = this.state.refreshing;
    const appointments = this.state.appointments;

    return (
      <Screen>
        <StatusBar
          backgroundColor="white"
          barStyle="dark-content"
          animated={true}
        />

        <View style={{flex: 1, backgroundColor: 'white'}}>
          {!appointments && (
            <View styleName="flexible stretch vertical v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="horizontal h-center sm-gutter-top">
                LOADING...
              </Caption>
            </View>
          )}

          {appointments && appointments.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                SORRY... YOU HAVE NO COMPLETED APPOINTMENT YET...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  this.setState({
                    appointments: null,
                  });

                  this._refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {appointments && appointments.length > 0 && (
            <FlatList
              style={{flex: 1}}
              data={appointments}
              refreshControl={
                <RefreshControl
                  //refresh control used for the Pull to Refresh
                  refreshing={refreshing}
                  onRefresh={this._refresh}
                />
              }
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <View
                  key={item.id}
                  styleName="stretch vertical v-center sm-gutter">
                  <Row style={{elevation: 3, padding: 10}}>
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
                          {`Completed ${moment(
                            item.completedDatetime.toDate(),
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
                        <Caption style={{color: Colors.Dark}}>
                          Services:
                        </Caption>
                        <View
                          style={{backgroundColor: '#f2f2f2'}}
                          styleName="stretch">
                          <Divider styleName="line" />
                          <View styleName="sm-gutter horizontal space-between">
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
                </View>
              )}
            />
          )}
        </View>
      </Screen>
    );
  }
}
