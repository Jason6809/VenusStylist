import React, {Component} from 'react';
import {
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  AsyncStorage,
} from 'react-native';
import Modal from 'react-native-modal';

import {
  Screen,
  View,
  Title,
  Text,
  Caption,
  Tile,
  Row,
  Button,
  TouchableOpacity,
  Subtitle,
  Icon,
  Divider,
  Image,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import moment from 'moment';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'BookingDetailScreen: ';

export class BookingDetailScreen extends Component {
  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    this.state = {
      confirmationInfo: null,
      confirmationAction: null,
      isConfirmationVisible: false,
      isLoaderVisible: false,
    };

    this._acceptBookingRequest = this._acceptBookingRequest.bind(this);
    this._cancelBookingRequest = this._cancelBookingRequest.bind(this);
  }

  async _getFcmToken() {
    const TAG = 'getFcmToken: ';
    console.log(SCREEN, TAG, 'start... ');

    const {bookingRequestUid} = this.props.navigation.state.params;

    const UserStatusRef = await DATABASE.collection('UserStatus')
      .doc(bookingRequestUid)
      .get();
    console.log(SCREEN, TAG, 'UserStatusRef = ', UserStatusRef);

    var fcmToken = null;

    if (UserStatusRef.exists && UserStatusRef.data().fcmToken) {
      // statement
      fcmToken = UserStatusRef.data().fcmToken;
    }

    console.log(SCREEN, TAG, 'finish... ');
    return fcmToken;
  }

  async _acceptBookingRequest() {
    const TAG = 'acceptBookingRequest: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    try {
      await AsyncStorage.setItem('isSelfAction', 'true');
    } catch (e) {
      console.error(SCREEN, TAG, 'AsyncStorage.setItem: error...', e);
    }

    const {bookingRequestUid, stylist} = this.props.navigation.state.params;

    DATABASE.collection('BookingRequest')
      .doc(bookingRequestUid)
      .update({
        status: true,
        acceptedDatetime: new Date(),
      })
      .then(async () => {
        console.log(SCREEN, TAG, 'finish... ');

        const title = 'Hurray !';
        const body = `${stylist.profile.firstName} ${
          stylist.profile.lastName
        } has accept yours Booking Request`;

        try {
          await this._sendNotification(title, body);
        } catch (e) {
          console.error(SCREEN, '_sendNotification: error....', e);
        }

        ToastAndroid.show('Accept Successful', ToastAndroid.LONG);

        this.setState({
          isLoaderVisible: false,
        });

        this.props.navigation.popToTop();

        console.log(SCREEN, TAG, 'finish... ');
      });
  }

  async _cancelBookingRequest() {
    const TAG = 'cancelBookingRequest: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    try {
      await AsyncStorage.setItem('isSelfAction', 'true');
    } catch (e) {
      console.error(SCREEN, TAG, 'AsyncStorage.setItem: error...', e);
    }

    const {bookingRequestUid, stylist} = this.props.navigation.state.params;

    DATABASE.collection('BookingRequest')
      .doc(bookingRequestUid)
      .delete()
      .then(async () => {
        console.log(SCREEN, TAG, 'finish... ');

        var title;
        var body;
        if (this.state.confirmationAction === 'reject') {
          title = 'Ouch !';
          body = `${stylist.profile.firstName} ${
            stylist.profile.lastName
          } has reject yours Booking Request`;
        } else if (this.state.confirmationAction === 'cancel') {
          title = 'Ouch !';
          body = `${stylist.profile.firstName} ${
            stylist.profile.lastName
          } has cancel yours Appointment`;
        }

        try {
          await this._sendNotification(title, body);
        } catch (e) {
          console.error(SCREEN, '_sendNotification: error....', e);
        }

        ToastAndroid.show('Reject Successful', ToastAndroid.LONG);

        this.setState({
          isLoaderVisible: false,
        });

        this.props.navigation.popToTop();

        console.log(SCREEN, TAG, 'finish... ');
      });
  }

  async _sendNotification(title, body) {
    const TAG = '_sendNotification: ';
    console.log(SCREEN, TAG, 'start... ');

    try {
      var customerFcmToken = await this._getFcmToken();
    } catch (e) {
      console.error(SCREEN, TAG, '_getFcmToken: error....', e);
    }

    if (customerFcmToken) {
      const sendMessage = FUNCTIONS.httpsCallable('sendMessage');

      try {
        await sendMessage({
          fcmToken: customerFcmToken,
          title,
          body,
        });
        console.log(SCREEN, TAG, 'sendMessage: success....');
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'sendMessage: error....', e);
      }
    }

    console.log(SCREEN, TAG, 'finish... ');
  }

  render() {
    const {
      customer,
      stylist,
      serviceItem,
      serviceTypeName,
      timeslot,
      status,
      isCompleted,
    } = this.props.navigation.state.params;

    var completedDatetime;
    if (this.props.navigation.state.params.completedDatetime) {
      completedDatetime = moment(
        this.props.navigation.state.params.completedDatetime.toDate(),
      );
    }

    const bookingDatetime = moment(
      this.props.navigation.state.params.bookingDatetime.toDate(),
    );
    const createdDatetime = moment(
      this.props.navigation.state.params.createdDatetime.toDate(),
    );

    const confirmationInfo = this.state.confirmationInfo;
    const confirmationAction = this.state.confirmationAction;
    const isConfirmationVisible = this.state.isConfirmationVisible;
    const isLoaderVisible = this.state.isLoaderVisible;

    return (
      <Screen>
        <View style={{flex: 1, backgroundColor: 'white'}}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 15,
            }}>
            <View styleName="stretch lg-gutter-top">
              <Title styleName="md-gutter-bottom">Stylist:</Title>
              <Row style={{elevation: 3}}>
                <Image
                  styleName="small rounded-corners"
                  source={{
                    uri: stylist.profile.profilePic,
                  }}
                />
                <View styleName="vertical stretch v-center">
                  <Subtitle>{`${stylist.profile.firstName} ${
                    stylist.profile.lastName
                  }`}</Subtitle>
                  <View styleName="horizontal">
                    <Caption>{`${stylist.email}`}</Caption>
                  </View>
                </View>
                <Button styleName="right-icon" onPress={() => {}}>
                  <Icon name="right-arrow" />
                </Button>
              </Row>
            </View>

            <View styleName="stretch lg-gutter-top">
              <Title styleName="md-gutter-bottom">Customer:</Title>
              <Row style={{elevation: 3}}>
                <Image
                  styleName="small rounded-corners"
                  source={{
                    uri: customer.profile.profilePic,
                  }}
                />
                <View styleName="vertical stretch v-center">
                  <Subtitle>{`${customer.profile.firstName} ${
                    customer.profile.lastName
                  }`}</Subtitle>
                  <View styleName="horizontal">
                    <Caption>{`${customer.email}`}</Caption>
                  </View>
                </View>
                <Button styleName="right-icon" onPress={() => {}}>
                  <Icon name="right-arrow" />
                </Button>
              </Row>
            </View>

            <View styleName="stretch lg-gutter-top xl-gutter-bottom">
              <Title styleName="md-gutter-bottom">Details</Title>

              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>CREATED ON</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {createdDatetime.format('dddd, MMMM D Y, hh:mm A')}
                      </Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>

              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>BOOKING ON</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {bookingDatetime.format('dddd, MMMM D Y')}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Caption style={{color: 'red'}}>
                        {moment(timeslot).format('hh:mm A')}
                      </Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>

              {completedDatetime && (
                <View styleName="stretch md-gutter-bottom">
                  <Divider styleName="section-header">
                    <Caption style={{color: Colors.Dark}}>COMPLETED ON</Caption>
                  </Divider>

                  <View styleName="stretch">
                    <Divider styleName="line" />
                    <View styleName="md-gutter horizontal space-between">
                      <View styleName="flexible">
                        <Caption style={{color: Colors.Dark}}>
                          {completedDatetime.format('dddd, MMMM D Y, hh:mm A')}
                        </Caption>
                      </View>
                    </View>
                    <Divider styleName="line" />
                  </View>
                </View>
              )}

              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>LOCATION</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal space-between">
                    <View styleName="flexible horizontal h-center">
                      <Caption style={{color: Colors.Dark}}>
                        Some location...
                      </Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>

              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>SERVICES</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {serviceItem.serviceName}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-center">
                      <Caption>{serviceTypeName}</Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Caption style={{color: 'red'}}>
                        RM {serviceItem.price.toFixed(2)}
                      </Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>
            </View>

            {!status && !isCompleted && (
              <View styleName="stretch md-gutter-bottom horizontal">
                <Button
                  style={{elevation: 3}}
                  styleName="full-width"
                  onPress={() => {
                    this.setState({
                      confirmationInfo: 'Reject Booking Request ?',
                      confirmationAction: 'reject',
                      isConfirmationVisible: true,
                    });
                  }}>
                  <Icon name="clear-text" />
                  <Text>Reject</Text>
                </Button>

                <Button
                  style={{elevation: 3}}
                  styleName="full-width secondary"
                  onPress={() => {
                    this.setState({
                      confirmationInfo: 'Accept Booking Request ?',
                      confirmationAction: 'accept',
                      isConfirmationVisible: true,
                    });
                  }}>
                  <Icon name="checkbox-on" />
                  <Text>Accept</Text>
                </Button>
              </View>
            )}

            {status && !isCompleted && (
              <View styleName="stretch md-gutter-bottom horizontal">
                <Button
                  style={{elevation: 3}}
                  styleName="full-width"
                  onPress={() => {
                    this.setState({
                      confirmationInfo: 'Cancel Appointment ?',
                      confirmationAction: 'cancel',
                      isConfirmationVisible: true,
                    });
                  }}>
                  <Icon name="clear-text" />
                  <Text>Cancel</Text>
                </Button>
              </View>
            )}
          </ScrollView>
        </View>

        <Modal
          isVisible={isConfirmationVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackdropPress={() => {
            this.setState({
              isConfirmationVisible: false,
            });
          }}
          onBackButtonPress={() => {
            this.setState({
              isConfirmationVisible: false,
            });
          }}>
          <View style={{backgroundColor: 'white', padding: 15}}>
            <View styleName="stretch">
              <Subtitle styleName="sm-gutter-bottom">CONFIRMATION</Subtitle>
            </View>
            <View styleName="stretch sm-gutter-top md-gutter-bottom">
              <Divider styleName="line" />
              <Text
                style={{color: 'red'}}
                styleName="h-center lg-gutter-top lg-gutter-bottom">
                {confirmationInfo}
              </Text>
              <Divider styleName="line" />
            </View>
            <View styleName="stretch horizontal">
              <Button
                style={{elevation: 3}}
                styleName="full-width"
                onPress={() => {
                  this.setState({
                    isConfirmationVisible: false,
                  });
                }}>
                <Icon name="clear-text" />
                <Text>NO</Text>
              </Button>

              <Button
                style={{elevation: 3}}
                styleName="full-width secondary"
                onPress={() => {
                  if (confirmationAction && confirmationAction === 'accept') {
                    this._acceptBookingRequest();
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'reject'
                  ) {
                    this._cancelBookingRequest();
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'cancel'
                  ) {
                    this._cancelBookingRequest();
                  }

                  this.setState({
                    isConfirmationVisible: false,
                  });
                }}>
                <Icon name="checkbox-on" />
                <Text>YES</Text>
              </Button>
            </View>
          </View>
        </Modal>

        <Modal
          style={{margin: 96}}
          isVisible={isLoaderVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}>
          <View style={{backgroundColor: 'white', padding: 15}}>
            <View styleName="horizontal h-center v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="md-gutter-left">LOADING...</Caption>
            </View>
          </View>
        </Modal>
      </Screen>
    );
  }
}
