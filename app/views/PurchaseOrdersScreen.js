import React, {Component} from 'react';
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  AsyncStorage,
  ToastAndroid,
} from 'react-native';
import Modal from 'react-native-modal';

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
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'PurchaseOrdersScreen: ';

export class PurchaseOrdersScreen extends Component {
  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    this.onPurchaseOrdersSnapshot = null;
    this.onPurchaseOrdersChanges = null;

    this.state = {
      refreshing: false,
      purchaseOrders: null,
      selectedPurchaseOrders: null,
      selectedItemName: null,
      confirmationInfo: null,
      confirmationAction: null,
      isConfirmationVisible: false,
      isLoaderVisible: false,
    };

    this._refresh = this._refresh.bind(this);
    this._updatePurchaseOrders = this._updatePurchaseOrders.bind(this);
  }

  componentDidMount() {
    this._fetchPurchaseOrders();
    this._listenForPurchaseOrdersChanges();
  }

  async _getFcmToken() {
    const TAG = 'getFcmToken: ';
    console.log(SCREEN, TAG, 'start... ');

    // const {bookingRequestUid} = this.props.navigation.state.params;
    const {selectedPurchaseOrders} = this.state;

    const UserStatusRef = await DATABASE.collection('UserStatus')
      .doc(selectedPurchaseOrders.customerUid)
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

  async _fetchPurchaseOrders() {
    const currentUser = AUTH.currentUser;

    const PurchaseOrdersRef = DATABASE.collection('PurchaseOrders');
    this.onPurchaseOrdersSnapshot = PurchaseOrdersRef.where(
      'stylistUid',
      '==',
      currentUser.uid,
    )
      .where('status', '==', false)
      .onSnapshot(async querySnapshot => {
        const TAG = 'onPurchaseOrdersSnapshot: ';
        console.log(SCREEN, TAG, 'start... ');
        console.log(SCREEN, TAG, 'querySnapshot = ', querySnapshot);

        const items = [];

        for (const PurchaseOrder of querySnapshot.docs) {
          console.log(SCREEN, TAG, 'PurchaseOrder = ', PurchaseOrder);

          const {customerUid} = PurchaseOrder.data();

          const UserRef = DATABASE.collection('Users');
          try {
            var customer = await UserRef.doc(customerUid).get();
            console.log(SCREEN, TAG, 'customer = ', customer);
          } catch (e) {
            // statements
            console.log(SCREEN, TAG, 'customer: error', e);
          }

          PurchaseOrder.data().id = PurchaseOrder.id;

          items.push({
            customer: {...customer.data()},
            ...PurchaseOrder.data(),
          });
        }

        console.log(SCREEN, 'items = ', items);

        this.setState({
          refreshing: false,
          purchaseOrders: items,
        });

        console.log(SCREEN, 'finish... ');
      });
  }

  _listenForPurchaseOrdersChanges() {
    const currentUser = AUTH.currentUser;

    const PurchaseOrdersRef = DATABASE.collection('PurchaseOrders');
    this.onPurchaseOrdersChanges = PurchaseOrdersRef.where(
      'stylistUid',
      '==',
      currentUser.uid,
    )
      .where('status', '==', false)
      .onSnapshot(async querySnapshot => {
        const TAG = 'onPurchaseOrdersChanges: ';
        console.log(SCREEN, TAG, 'start... ');

        for (const docChange of querySnapshot.docChanges) {
          console.log(SCREEN, TAG, 'docChange = ', docChange);
          const {customer} = docChange.doc.data();

          const key = `Market_${docChange.doc.id}`;

          try {
            var isSent = await AsyncStorage.getItem(key);
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
              console.log(SCREEN, TAG, 'isSent = ', isSent);

              if (isSent === null || isSent === undefined) {
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

  async _refresh() {
    const TAG = 'refresh: ';
    console.log(SCREEN, TAG, 'start...');

    this.setState({
      refreshing: true,
    });

    try {
      // statements
      await this._fetchPurchaseOrders();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'fetchCart: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish...');
  }

  async _updatePurchaseOrders() {
    const TAG = '_updatePurchaseOrders: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    const {selectedPurchaseOrders} = this.state;

    DATABASE.collection('PurchaseOrders')
      .doc(selectedPurchaseOrders.id)
      .update({
        status: true,
        updateDatetime: new Date(),
      })
      .then(async () => {
        console.log(SCREEN, TAG, 'finish... ');

        const title = 'Heads Up !';
        const body = `Yours ${selectedPurchaseOrders.itemName} is in Shipping`;

        try {
          await this._sendNotification(title, body);
        } catch (e) {
          console.error(SCREEN, '_sendNotification: error....', e);
        }

        ToastAndroid.show('Update Successful', ToastAndroid.LONG);

        this.setState({
          isLoaderVisible: false,
        });

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

  componentWillUnmount() {
    const TAG = 'componentWillUnmount: ';
    console.log(SCREEN, TAG, 'start...');

    if (this.onPurchaseOrdersSnapshot) {
      console.log(
        SCREEN,
        TAG,
        'onPurchaseOrdersSnapshot = ',
        this.onPurchaseOrdersSnapshot,
      );

      this.onPurchaseOrdersSnapshot();
    }

    if (this.onPurchaseOrdersChanges) {
      console.log(
        SCREEN,
        TAG,
        'onPurchaseOrdersChanges = ',
        this.onPurchaseOrdersChanges,
      );

      this.onPurchaseOrdersChanges();
    }
  }

  render() {
    const {
      refreshing,
      purchaseOrders,
      confirmationInfo,
      confirmationAction,
      isConfirmationVisible,
      isLoaderVisible,
    } = this.state;

    return (
      <Screen>
        <StatusBar
          backgroundColor={Colors.Misty_Rose}
          barStyle="dark-content"
          animated={true}
        />

        <View style={{flex: 1, backgroundColor: 'white'}}>
          {!purchaseOrders && (
            <View styleName="flexible stretch horizontal v-center h-center">
              <Image source={require('../assets/loader_small.gif')} />
              <Caption style={{color: Colors.Dark}} styleName="md-gutter-left">
                LOADING...
              </Caption>
            </View>
          )}

          {purchaseOrders && purchaseOrders.length <= 0 && (
            <View styleName="md-gutter flexible stretch vertical v-center">
              <Caption
                style={{color: Colors.Dark}}
                styleName="horizontal h-center sm-gutter-top">
                YOU PURCHASE ORDERS IS EMPTY...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  this.setState({
                    purchaseOrders: null,
                  });

                  this._refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {purchaseOrders && purchaseOrders.length > 0 && (
            <FlatList
              contentContainerStyle={{
                paddingTop: 5,
                paddingBottom: 45,
                paddingHorizontal: 5,
              }}
              refreshControl={
                <RefreshControl
                  //refresh control used for the Pull to Refresh
                  refreshing={refreshing}
                  onRefresh={() => {
                    this._refresh();
                  }}
                />
              }
              data={purchaseOrders}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <View
                  style={{
                    elevation: 3,
                    backgroundColor: 'white',
                    marginBottom: 5,
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                  }}>
                  <Row style={{paddingVertical: 10, paddingHorizontal: 15}}>
                    <Image
                      style={{
                        backgroundColor: '#f2f2f2',
                      }}
                      styleName="small rounded-corners"
                      source={{
                        uri: item.productPic,
                      }}
                    />
                    <View styleName="vertical stretch space-between">
                      <Subtitle>{item.productName}</Subtitle>

                      <View styleName="horizontal v-center space-between">
                        <Caption style={{color: Colors.Dark}}>
                          {item.variant.variantName}
                        </Caption>
                        <Caption style={{color: 'red'}}>
                          {item.purchaseQuantity} PCS
                        </Caption>
                      </View>
                    </View>
                  </Row>

                  <Divider styleName="line" />

                  <Row style={{paddingVertical: 10, paddingHorizontal: 15}}>
                    <Image
                      style={{
                        backgroundColor: '#f2f2f2',
                      }}
                      styleName="small rounded-corners"
                      source={{
                        uri: item.customer.profile.profilePic,
                      }}
                    />
                    <View styleName="vertical stretch">
                      <Subtitle>{`${item.customer.profile.firstName} ${
                        item.customer.profile.lastName
                      }`}</Subtitle>
                      <Caption style={{color: Colors.Dark}}>
                        {item.customer.email}
                      </Caption>
                    </View>
                  </Row>

                  <Divider styleName="line" />

                  <View
                    style={{marginTop: 10, marginBottom: 5}}
                    styleName="horizontal h-end">
                    <Button
                      style={{paddingHorizontal: 5, elevation: 3}}
                      styleName="secondary"
                      onPress={() => {
                        console.log(SCREEN, 'item.id = ', item.id);

                        this.setState({
                          selectedPurchaseOrders: {
                            itemName: item.productName,
                            id: item.id,
                            customerUid: item.customerUid,
                          },
                          confirmationInfo: 'Update Status to "In Shipping"',
                          confirmationAction: 'update',
                          isConfirmationVisible: true,
                        });
                      }}>
                      <Caption style={{color: 'white'}}>UPDATE STATUS</Caption>
                    </Button>
                  </View>
                </View>
              )}
            />
          )}
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
                  if (confirmationAction && confirmationAction === 'update') {
                    this._updatePurchaseOrders();
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
