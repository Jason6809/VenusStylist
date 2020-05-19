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

const SCREEN = 'PurchaseHistoryScreen: ';

export class PurchaseHistoryScreen extends Component {
  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    this.onUserProfileSnapshot = null;
    this.onPurchaseHistorySnapshot = null;
    this.state = {
      loading: true,
      refreshing: false,
      purchaseOrders: null,
      userProfile: null,
    };

    this._refresh = this._refresh.bind(this);
  }

  componentDidMount() {
    this._getUserProfile();
    this._fetchPurchaseOrders();
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

  async _fetchPurchaseOrders() {
    const currentUser = AUTH.currentUser;

    const PurchaseOrdersRef = DATABASE.collection('PurchaseHistory');
    this.onPurchaseOrdersSnapshot = PurchaseOrdersRef.where(
      'stylistUid',
      '==',
      currentUser.uid,
    ).onSnapshot(async querySnapshot => {
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
  }

  render() {
    const refreshing = this.state.refreshing;
    const purchaseOrders = this.state.purchaseOrders;

    return (
      <Screen>
        <StatusBar
          backgroundColor="white"
          barStyle="dark-content"
          animated={true}
        />

        <View style={{flex: 1, backgroundColor: 'white'}}>
          {!purchaseOrders && (
            <View styleName="flexible stretch vertical v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="horizontal h-center sm-gutter-top">
                LOADING...
              </Caption>
            </View>
          )}

          {purchaseOrders && purchaseOrders.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                SORRY... YOU HAVE NO COMPLETED APPOINTMENT YET...
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
              data={purchaseOrders}
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
                  style={{
                    elevation: 3,
                    backgroundColor: 'white',
                    marginBottom: 5,
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                  }}>
                  <Row style={{paddingVertical: 10, paddingHorizontal: 5}}>
                    <View
                      style={{
                        flex: 0,
                        alignSelf: 'flex-start',
                        padding: 5,
                        marginRight: 10,
                        elevation: 3,
                        backgroundColor: '#f2f2f2',
                      }}>
                      <Image
                        styleName="small rounded-corners"
                        source={{
                          uri: item.productPic,
                        }}
                      />
                    </View>
                    <View styleName="vertical stretch space-between">
                      <Subtitle>{item.variant.variantName}</Subtitle>
                      <Caption>{item.productName}</Caption>

                      <View styleName="horizontal v-center space-between">
                        <Text style={{color: 'red'}}>
                          {'RM ' +
                            (
                              item.variant.price.toFixed(2) *
                              item.purchaseQuantity
                            ).toFixed(2)}
                        </Text>
                        <Caption style={{color: Colors.Dark}}>
                          RM {item.variant.price.toFixed(2)} / pcs
                        </Caption>

                        <Caption style={{color: 'red'}}>
                          {item.purchaseQuantity} PCS
                        </Caption>
                      </View>
                    </View>
                  </Row>

                  <Divider styleName="line" />

                  <Row style={{paddingVertical: 10, paddingHorizontal: 5}}>
                    <View
                      style={{
                        flex: 0,
                        alignSelf: 'flex-start',
                        padding: 5,
                        marginRight: 10,
                        elevation: 3,
                        backgroundColor: '#f2f2f2',
                      }}>
                      <Image
                        style={{
                          backgroundColor: '#f2f2f2',
                        }}
                        styleName="small rounded-corners"
                        source={{
                          uri: item.customer.profile.profilePic,
                        }}
                      />
                    </View>
                    <View styleName="vertical stretch">
                      <Subtitle>{`${item.customer.profile.firstName} ${
                        item.customer.profile.lastName
                      }`}</Subtitle>
                      <Caption style={{color: Colors.Dark}}>
                        {item.customer.email}
                      </Caption>
                      <Caption>
                        {`Created on ${moment(
                          item.createdDatetime.toDate(),
                        ).format('ddd, MMM D Y, hh:mm A')}`}
                      </Caption>
                    </View>
                  </Row>

                  <Divider styleName="line" />

                  <View
                    style={{marginTop: 10, marginBottom: 5}}
                    styleName="horizontal h-end">
                    <Caption
                      styleName="horizontal h-end"
                      style={{color: 'green'}}>
                      &#9432;
                      {` Completed in ${moment(
                        item.completedDatetime.toDate(),
                      ).format('ddd, MMM D Y, hh:mm A')}`}
                    </Caption>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </Screen>
    );
  }
}
