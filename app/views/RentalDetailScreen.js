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

const SCREEN = 'RentalDetailScreen: ';

export class RentalDetailScreen extends Component {
  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    this.state = {
      confirmationInfo: null,
      confirmationAction: null,
      isConfirmationVisible: false,
      isLoaderVisible: false,
    };

    this._acceptRentalRequest = this._acceptRentalRequest.bind(this);
    this._cancelRentalRequest = this._cancelRentalRequest.bind(this);
    this._completeRental = this._completeRental.bind(this);
  }

  async _getFcmToken() {
    const TAG = 'getFcmToken: ';
    console.log(SCREEN, TAG, 'start... ');

    const {rentalRequestUid} = this.props.navigation.state.params;

    const UserStatusRef = await DATABASE.collection('UserStatus')
      .doc(rentalRequestUid)
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

  async _completeRental() {
    const TAG = 'completeRental: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    try {
      await AsyncStorage.setItem('isCancelledBySelf', 'true');
    } catch (e) {
      console.error(SCREEN, TAG, 'AsyncStorage.setItem: error...', e);
    }

    const {rentalRequestUid, stylist} = this.props.navigation.state.params;

    const RentalRequest = this.props.navigation.state.params;
    RentalRequest.isCompleted = true;

    const RentalHistoryRef = DATABASE.collection('RentalHistory');
    RentalHistoryRef.add({
      ...RentalRequest,
      completedDatetime: new Date(),
      commissionRate: 20,
    }).then(doc => {
      console.log(SCREEN, TAG, 'doc = ', doc);

      const RentalRequestRef = DATABASE.collection('RentalRequest');
      RentalRequestRef.doc(rentalRequestUid)
        .delete()
        .then(async () => {
          console.log(SCREEN, TAG, 'finish... ');

          const title = 'Yeah !';
          const body = `${stylist.profile.firstName} ${
            stylist.profile.lastName
          } has completed yours Rental`;

          try {
            await this._sendNotification(title, body);
          } catch (e) {
            console.error(SCREEN, TAG, 'sendNotification: error....', e);
          }

          ToastAndroid.show('Complete Successful', ToastAndroid.LONG);

          this.setState({
            isLoaderVisible: false,
          });

          this.props.navigation.popToTop();
        });
    });
  }

  async _acceptRentalRequest() {
    const TAG = 'acceptRentalRequest: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    try {
      await AsyncStorage.setItem('isSelfAction', 'true');
    } catch (e) {
      console.error(SCREEN, TAG, 'AsyncStorage.setItem: error...', e);
    }

    const {
      rentalRequestUid,
      stylist,
      rentalPeriod,
    } = this.props.navigation.state.params;

    const acceptedDatetime = new Date();

    const returnDatetime = new Date(
      moment(acceptedDatetime)
        .add(rentalPeriod, 'days')
        .format(),
    );

    DATABASE.collection('RentalRequest')
      .doc(rentalRequestUid)
      .update({
        status: true,
        acceptedDatetime,
        returnDatetime,
      })
      .then(async () => {
        console.log(SCREEN, TAG, 'finish... ');

        const title = 'Hurray !';
        const body = `${stylist.profile.firstName} ${
          stylist.profile.lastName
        } has accept yours Rental Request`;

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

  async _cancelRentalRequest() {
    const TAG = 'cancelRentalRequest: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    try {
      await AsyncStorage.setItem('isSelfAction', 'true');
    } catch (e) {
      console.error(SCREEN, TAG, 'AsyncStorage.setItem: error...', e);
    }

    const {rentalRequestUid, stylist} = this.props.navigation.state.params;

    DATABASE.collection('RentalRequest')
      .doc(rentalRequestUid)
      .delete()
      .then(async () => {
        console.log(SCREEN, TAG, 'finish... ');

        var title;
        var body;
        if (this.state.confirmationAction === 'reject') {
          title = 'Ouch !';
          body = `${stylist.profile.firstName} ${
            stylist.profile.lastName
          } has reject yours Rental Request`;
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
      itemName,
      itemPic,
      itemTypeName,
      variant,
      rentalPeriod,
      status,
      isCompleted,
    } = this.props.navigation.state.params;

    var returnDatetime;
    if (this.props.navigation.state.params.returnDatetime) {
      returnDatetime = moment(
        this.props.navigation.state.params.returnDatetime.toDate(),
      );
    }

    var completedDatetime;
    if (this.props.navigation.state.params.completedDatetime) {
      completedDatetime = moment(
        this.props.navigation.state.params.completedDatetime.toDate(),
      );
    }

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
              <Title styleName="md-gutter-bottom">Rental Item</Title>
              <Row style={{elevation: 3}}>
                <Image
                  styleName="small rounded-corners"
                  source={{
                    uri: itemPic,
                  }}
                />
                <View styleName="vertical stretch v-center">
                  <Subtitle>{itemName}</Subtitle>
                  <View styleName="horizontal">
                    <Caption>{itemTypeName}</Caption>
                  </View>
                </View>
              </Row>
            </View>

            <View styleName="stretch lg-gutter-top">
              <Title styleName="md-gutter-bottom">Customer</Title>
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

              {returnDatetime && (
                <View styleName="stretch md-gutter-bottom">
                  <Divider styleName="section-header">
                    <Caption style={{color: Colors.Dark}}>RETURN ON</Caption>
                  </Divider>

                  <View styleName="stretch">
                    <Divider styleName="line" />
                    <View styleName="md-gutter horizontal space-between">
                      <View styleName="flexible">
                        <Caption style={{color: Colors.Dark}}>
                          {returnDatetime.format('dddd, MMMM D Y, hh:mm A')}
                        </Caption>
                      </View>
                    </View>
                    <Divider styleName="line" />
                  </View>
                </View>
              )}

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
                          {completedDatetime.format(
                            'dddd, MMMM D Y, hh:mm A',
                          )}
                        </Caption>
                      </View>
                    </View>
                    <Divider styleName="line" />
                  </View>
                </View>
              )}

              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>RENTAL ITEM</Caption>
                  <Caption style={{color: Colors.Dark}}>ITEM TYPE</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>{itemName}</Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Caption>{itemTypeName}</Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>

              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>ITEM VARIANT</Caption>
                  <Caption style={{color: Colors.Dark}}>RENTAL PRICE</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {variant.variantName}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Caption style={{color: 'red'}}>
                        RM {variant.price.toFixed(2)} / day
                      </Caption>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              </View>

              <View styleName="stretch md-gutter-bottom">
                <Divider styleName="section-header">
                  <Caption style={{color: Colors.Dark}}>RENTAL PERIOD</Caption>
                  <Caption style={{color: Colors.Dark}}>TOTAL AMOUNT</Caption>
                </Divider>

                <View styleName="stretch">
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <Caption style={{color: 'red'}}>
                        {rentalPeriod} day(s)
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Caption style={{color: 'red'}}>
                        {'RM ' +
                          (variant.price.toFixed(2) * rentalPeriod).toFixed(2)}
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
                      confirmationInfo: 'Reject Rental Request ?',
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
                      confirmationInfo: 'Accept Rental Request ?',
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
                  styleName="full-width secondary"
                  onPress={() => {
                    this.setState({
                      confirmationInfo: 'Complete Rental ?',
                      confirmationAction: 'complete',
                      isConfirmationVisible: true,
                    });
                  }}>
                  <Icon name="checkbox-on" />
                  <Text>Complete</Text>
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
                    this._acceptRentalRequest();
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'reject'
                  ) {
                    this._cancelRentalRequest();
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'complete'
                  ) {
                    this._completeRental();
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
