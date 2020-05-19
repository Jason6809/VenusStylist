import React, {Component} from 'react';
import {
  StyleSheet,
  FlatList,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import Modal from 'react-native-modal';
import ImagePicker from 'react-native-image-picker';
import DateTimePicker from 'react-native-modal-datetime-picker';
import {TextInputMask} from 'react-native-masked-text';

import {
  Screen,
  NavigationBar,
  View,
  Title,
  Subtitle,
  Text,
  TextInput,
  Caption,
  Tile,
  Button,
  Switch,
  Icon,
  Row,
  TouchableOpacity,
  Card,
  Image,
  ImageBackground,
  Lightbox,
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

const SCREEN = 'ManageServicesScreen: ';

export class ManageServicesScreen extends Component {
  static navigationOptions = ({navigation}) => {
    return {
      headerRight: (
        <Button
          style={{marginRight: 15, paddingLeft: 10}}
          styleName="secondary"
          onPress={navigation.getParam('toggleServiceEditorVisible')}>
          <Caption style={{color: 'white'}}>ADD</Caption>
          <Icon style={{margin: 0}} name="plus-button" />
        </Button>
      ),
    };
  };

  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    this.state = {
      refreshing: false,
      serviceTypes: null,
      selectedServiceType: null,
      serviceItems: null,
      selectedItemKey: null,
      serviceName: null,
      price: 0,
      serviceTimeslots: null,
      servicePhotos: null,
      isServiceEditorVisible: false,
      isServicePickerVisible: false,
      isDateTimePickerVisible: false,
      isConfirmationVisible: false,
      confirmationAction: null,
      confirmationInfo: null,
      isLoaderVisible: false,
      isDisabled: false,
      isModified: false,
      error: null,
    };

    this._refresh = this._refresh.bind(this);
    this._getTimeslots = this._getTimeslots.bind(this);
    this._addTimeslot = this._addTimeslot.bind(this);
    this._deleteTimeslot = this._deleteTimeslot.bind(this);
    this._addPhotos = this._addPhotos.bind(this);
    this._deletePhotos = this._deletePhotos.bind(this);
    this._handleServiceName = this._handleServiceName.bind(this);
    this._handleServicePrice = this._handleServicePrice.bind(this);
    this._createServiceItem = this._createServiceItem.bind(this);
    this._updateServiceItem = this._updateServiceItem.bind(this);
    this._deleteServiceItem = this._deleteServiceItem.bind(this);

    this._toggleServiceEditorVisible = this._toggleServiceEditorVisible.bind(
      this,
    );
  }

  componentDidMount() {
    try {
      this._fetchServices();
    } catch (e) {
      // statements
      console.error(SCREEN, '_fetchServices: error...', e);
    }

    this.props.navigation.setParams({
      toggleServiceEditorVisible: this._toggleServiceEditorVisible,
    });
  }

  _toggleServiceEditorVisible() {
    this.setState({
      serviceTimeslots: null,
      selectedItemKey: null,
      selectedServiceType: null,
      serviceName: null,
      price: 0.01,
      isDisabled: false,
      isServiceEditorVisible: true,
      error: null,
    });
  }

  async _fetchServices() {
    const TAG = '_fetchServices: ';
    console.log(SCREEN, TAG, 'start... ');

    const currentUser = AUTH.currentUser;

    const services = [];

    const ServiceTypesRef = DATABASE.collection('ServiceTypes');
    try {
      var ServiceTypes = await ServiceTypesRef.get();
      console.log(SCREEN, TAG, 'ServiceTypes = ', ServiceTypes);
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'ServiceTypes:error... ', e);
    }

    const serviceTypes = [];
    for (const ServiceType of ServiceTypes.docs) {
      const {serviceTypeKey, serviceTypeName} = ServiceType.data();

      serviceTypes.push({
        serviceTypeKey,
        serviceTypeName,
      });

      const ServiceItemsRef = await DATABASE.collection('UserServices')
        .doc(currentUser.uid)
        .collection(serviceTypeKey)
        .orderBy('price')
        .get();
      console.log(SCREEN, TAG, 'ServiceItemsRef = ', ServiceItemsRef);

      if (!ServiceItemsRef.empty) {
        const title = serviceTypeName;
        const data = [];
        for (const ServiceItem of ServiceItemsRef.docs) {
          data.push({
            id: ServiceItem.id,
            serviceType: {
              serviceTypeKey,
              serviceTypeName,
            },
            ...ServiceItem.data(),
          });
        }

        services.push({
          title,
          data,
        });
      }
    }

    console.log(SCREEN, TAG, 'services = ', services);

    // statement
    this.setState({
      refreshing: false,
      serviceTypes,
      serviceItems: services,
    });

    console.log(SCREEN, TAG, 'finish...');
  }

  async _refresh() {
    const TAG = 'refresh: ';
    console.log(SCREEN, TAG, 'start...');

    this.setState({
      refreshing: true,
    });

    try {
      // statements
      await this._fetchServices();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, '_fetchProducts: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish...');
  }

  async _getTimeslots(serviceItemKey, serviceTypeKey) {
    const TAG = 'getTimeslots: ';

    const currentUser = AUTH.currentUser;

    const UserServiceRef = DATABASE.collection('UserServices').doc(
      currentUser.uid,
    );

    const ServiceTypeRef = UserServiceRef.collection(serviceTypeKey);

    const ServiceItemRef = ServiceTypeRef.doc(serviceItemKey);

    const TimeslotsRef = await ServiceItemRef.collection('Timeslots')
      .orderBy('hours')
      .get();

    const timeslots = [];

    for (const timeslot of TimeslotsRef.docs) {
      timeslots.push({
        id: timeslot.id,
        timeslot: timeslot.data(),
      });
    }

    console.log(SCREEN, TAG, 'timeslots = ', timeslots);

    return timeslots;
  }

  async _getPhotos(serviceItemKey, serviceTypeKey) {
    const TAG = '_getPhotos: ';

    const currentUser = AUTH.currentUser;

    const UserServiceRef = DATABASE.collection('UserServices').doc(
      currentUser.uid,
    );

    const ServiceTypeRef = UserServiceRef.collection(serviceTypeKey);

    const ServiceItemRef = ServiceTypeRef.doc(serviceItemKey);

    const PhotosRef = await ServiceItemRef.collection('Photos').get();

    const servicePhotos = [];

    for (const Photo of PhotosRef.docs) {
      servicePhotos.push({
        id: Photo.id,
        ...Photo.data(),
      });
    }

    console.log(SCREEN, TAG, 'servicePhotos = ', servicePhotos);

    return servicePhotos;
  }

  async _addTimeslot(time) {
    const TAG = '_addTimeslot: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isDateTimePickerVisible: false,
      isLoaderVisible: true,
    });

    const hours = time.getHours();
    const minutes = time.getMinutes();

    const currentUser = AUTH.currentUser;
    const {selectedServiceType, selectedItemKey} = this.state;

    const UserServiceRef = DATABASE.collection('UserServices').doc(
      currentUser.uid,
    );

    const ServiceTypeRef = UserServiceRef.collection(
      selectedServiceType.serviceTypeKey,
    );

    const ServiceItemRef = ServiceTypeRef.doc(selectedItemKey);

    try {
      await ServiceItemRef.collection('Timeslots').add({
        hours,
        minutes,
      });
    } catch (e) {
      console.error(SCREEN, TAG, 'error....', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._getTimeslots(selectedItemKey, selectedServiceType.serviceTypeKey)
      .then(result => {
        ToastAndroid.show(
          'Create Successful and Auto Saved',
          ToastAndroid.LONG,
        );

        this.setState({
          serviceTimeslots: result,
          isLoaderVisible: false,
        });
      })
      .catch(error => {
        console.error(SCREEN, '_getTimeslots: error....', error);
      });
  }

  async _deleteTimeslot(timeslotKey) {
    const TAG = '_deleteTimeslot: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    const currentUser = AUTH.currentUser;
    const {selectedServiceType, selectedItemKey} = this.state;

    const UserServiceRef = DATABASE.collection('UserServices').doc(
      currentUser.uid,
    );

    const ServiceTypeRef = UserServiceRef.collection(
      selectedServiceType.serviceTypeKey,
    );

    const ServiceItemRef = ServiceTypeRef.doc(selectedItemKey);

    try {
      await ServiceItemRef.collection('Timeslots')
        .doc(timeslotKey)
        .delete();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error....', e);
    }

    console.log(SCREEN, TAG, 'finish...');

    this._getTimeslots(selectedItemKey, selectedServiceType.serviceTypeKey)
      .then(result => {
        ToastAndroid.show(
          'Delete Successful and Auto Saved',
          ToastAndroid.LONG,
        );

        this.setState({
          isLoaderVisible: false,
          serviceTimeslots: result,
        });
      })
      .catch(error => {
        console.error(SCREEN, '_getTimeslots: error....', error);
      });
  }

  async _addPhotos() {
    const TAG = '_addPhotos: ';
    console.log(SCREEN, TAG, 'start... ');

    ImagePicker.showImagePicker({maxWidth: 512}, async response => {
      console.log(SCREEN, TAG, 'Response = ', response);

      if (response.didCancel) {
        console.log(SCREEN, TAG, 'User cancelled image picker');
      } else if (response.error) {
        console.log(SCREEN, TAG, 'ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log(
          SCREEN,
          TAG,
          'User tapped custom button: ',
          response.customButton,
        );
      } else {
        // You can also display the image using data:
        // const source = { uri: 'data:image/jpeg;base64,' + response.data };
        const uri = `data:${response.type};base64,${response.data}`;

        this.setState({
          isLoaderVisible: true,
        });

        const currentUser = AUTH.currentUser;
        const {selectedServiceType, selectedItemKey} = this.state;

        const UserServiceRef = DATABASE.collection('UserServices').doc(
          currentUser.uid,
        );

        const ServiceTypeRef = UserServiceRef.collection(
          selectedServiceType.serviceTypeKey,
        );

        const ServiceItemRef = ServiceTypeRef.doc(selectedItemKey);

        try {
          await ServiceItemRef.collection('Photos').add({uri});
        } catch (e) {
          // statements
          console.error(SCREEN, TAG, 'error....', e);
        }

        console.log(SCREEN, TAG, 'finish...');

        this._getPhotos(
          selectedItemKey,
          selectedServiceType.serviceTypeKey,
        ).then(result => {
          ToastAndroid.show(
            'Upload Successful and Auto Saved',
            ToastAndroid.LONG,
          );

          this.setState({
            isLoaderVisible: false,
            servicePhotos: result,
          });

          console.log(SCREEN, TAG, 'finish... ');
        });
      }
    });
  }

  async _deletePhotos(photoKey) {
    const TAG = '_deletePhotos: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    const currentUser = AUTH.currentUser;
    const {selectedServiceType, selectedItemKey} = this.state;

    const UserServiceRef = DATABASE.collection('UserServices').doc(
      currentUser.uid,
    );

    const ServiceTypeRef = UserServiceRef.collection(
      selectedServiceType.serviceTypeKey,
    );

    const ServiceItemRef = ServiceTypeRef.doc(selectedItemKey);

    try {
      await ServiceItemRef.collection('Photos')
        .doc(photoKey)
        .delete();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error....', e);
    }

    console.log(SCREEN, TAG, 'finish...');

    this._getPhotos(selectedItemKey, selectedServiceType.serviceTypeKey)
      .then(result => {
        ToastAndroid.show(
          'Delete Successful and Auto Saved',
          ToastAndroid.LONG,
        );

        this.setState({
          isLoaderVisible: false,
          servicePhotos: result,
        });
      })
      .catch(error => {
        console.error(SCREEN, '_getPhotos: error....', error);
      });
  }

  _handleServiceName(serviceName) {
    const TAG = '_handleServiceName: ';
    console.log(SCREEN, TAG, 'serviceName = ', serviceName);

    this.setState({
      isModified: true,
      serviceName,
    });
  }

  _handleServicePrice(price) {
    const TAG = '_handleServicePrice: ';

    price = parseFloat(price.replace(/[^\d\.]/g, ''));
    console.log(SCREEN, TAG, 'price = ', price);

    this.setState({
      isModified: true,
      price,
    });
  }

  async _validation() {
    const TAG = '_validation: ';
    console.log(SCREEN, TAG, 'start... ');

    var {serviceName, selectedServiceType, price} = this.state;

    if (!serviceName || serviceName === '') {
      const error = {
        errorType: 'serviceName',
        errorMsg: 'Required ! ',
      };

      return Promise.reject(error);
    }

    if (!selectedServiceType) {
      const error = {
        errorType: 'selectedServiceType',
        errorMsg: 'Required ! ',
      };

      return Promise.reject(error);
    }

    if (!price || price === '') {
      const error = {
        errorType: 'price',
        errorMsg: 'Required ! ',
      };
      return Promise.reject(error);
    } else {
      if (price < 0) {
        const error = {
          errorType: 'price',
          errorMsg: 'Invalid value ! ',
        };

        return Promise.reject(error);
      }
    }

    this.setState({serviceName, selectedServiceType, price});

    console.log(SCREEN, TAG, 'finish... ');

    return Promise.resolve();
  }

  async _createServiceItem() {
    const TAG = '_createServiceItem: ';
    console.log(SCREEN, TAG, 'start... ');

    try {
      await this._validation();
    } catch (e) {
      return Promise.reject(e);
    }

    this.setState({
      isLoaderVisible: true,
    });

    const currentUser = AUTH.currentUser;
    const {selectedServiceType, serviceName, price} = this.state;

    const UserServiceRef = DATABASE.collection('UserServices').doc(
      currentUser.uid,
    );

    try {
      await UserServiceRef.update({
        [selectedServiceType.serviceTypeKey]: true,
      });
    } catch (e) {
      // statements
      console.log(SCREEN, TAG, 'error... ', e);
    }

    const ServiceTypeRef = UserServiceRef.collection(
      selectedServiceType.serviceTypeKey,
    );

    try {
      await ServiceTypeRef.add({
        serviceName,
        price,
      });
    } catch (e) {
      // statements
      console.log(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchServices().then(() => {
      ToastAndroid.show('Create Successful', ToastAndroid.LONG);

      this.setState({
        isServiceEditorVisible: false,
        isLoaderVisible: false,
        isModified: false,
      });
    });
  }

  async _updateServiceItem() {
    const TAG = '_updateServiceItem: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    const currentUser = AUTH.currentUser;
    const {
      selectedServiceType,
      selectedItemKey,
      serviceName,
      price,
    } = this.state;

    const UserServiceRef = DATABASE.collection('UserServices').doc(
      currentUser.uid,
    );

    const ServiceTypeRef = UserServiceRef.collection(
      selectedServiceType.serviceTypeKey,
    );

    try {
      await ServiceTypeRef.doc(selectedItemKey).update({
        serviceName,
        price,
      });
    } catch (e) {
      // statements
      console.log(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchServices().then(() => {
      ToastAndroid.show('Update Successful', ToastAndroid.LONG);

      this.setState({
        isServiceEditorVisible: false,
        isLoaderVisible: false,
        isModified: false,
      });
    });
  }

  async _deleteServiceItem() {
    const TAG = '_deleteServiceItem: ';
    console.log(SCREEN, TAG, 'finish... ');

    this.setState({
      isLoaderVisible: true,
    });

    const currentUser = AUTH.currentUser;
    const {selectedServiceType, selectedItemKey} = this.state;

    const UserServiceRef = DATABASE.collection('UserServices').doc(
      currentUser.uid,
    );

    const ServiceTypeRef = UserServiceRef.collection(
      selectedServiceType.serviceTypeKey,
    ).doc(selectedItemKey);

    try {
      await ServiceTypeRef.delete();
    } catch (e) {
      // statements
      console.log(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchServices().then(() => {
      ToastAndroid.show('Delete Successful', ToastAndroid.LONG);

      this.setState({
        isServiceEditorVisible: false,
        isLoaderVisible: false,
        isModified: false,
      });
    });
  }

  render() {
    const {
      refreshing,
      serviceTypes,
      selectedServiceType,
      serviceItems,
      selectedItemKey,
      serviceName,
      price,
      serviceTimeslots,
      servicePhotos,
      isServiceEditorVisible,
      isServicePickerVisible,
      isDateTimePickerVisible,
      isConfirmationVisible,
      confirmationAction,
      confirmationInfo,
      isLoaderVisible,
      isModified,
      isDisabled,
      error,
    } = this.state;

    return (
      <Screen>
        <StatusBar
          backgroundColor="white"
          barStyle="dark-content"
          animated={true}
        />

        <View style={{flex: 1, backgroundColor: 'white'}}>
          {!serviceItems && (
            <View styleName="flexible stretch vertical v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="horizontal h-center sm-gutter-top">
                LOADING...
              </Caption>
            </View>
          )}

          {serviceItems && serviceItems.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                SORRY... CAN'T FIND SUITABLE STYLIST FOR YOU...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  this.setState({
                    serviceItems: null,
                  });

                  this._refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {serviceItems && serviceItems.length > 0 && (
            <SectionList
              contentContainerStyle={{
                paddingLeft: 15,
                paddingRight: 15,
                paddingBottom: 45,
              }}
              refreshControl={
                <RefreshControl
                  //refresh control used for the Pull to Refresh
                  refreshing={refreshing}
                  onRefresh={this._refresh}
                />
              }
              sections={serviceItems}
              keyExtractor={item => item.id}
              renderSectionHeader={({section: {title}}) => (
                <View styleName="lg-gutter-top">
                  <Title styleName="md-gutter-bottom">{title}</Title>
                  <Divider styleName="section-header">
                    <Caption style={{color: Colors.Dark}}>SERVICES</Caption>
                    <Caption style={{color: Colors.Dark}}>PRICE</Caption>
                    <Caption style={{color: Colors.Dark}}>EDIT</Caption>
                  </Divider>
                </View>
              )}
              renderItem={({item}) => (
                <View>
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {item.serviceName}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-center">
                      <Caption style={{color: 'red'}}>
                        RM {item.price.toFixed(2)}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Button
                        styleName="tight clear"
                        onPress={() => {
                          this.setState({
                            serviceTimeslots: null,
                            servicePhotos: null,
                            selectedItemKey: item.id,
                            selectedServiceType: item.serviceType,
                            serviceName: item.serviceName,
                            price: item.price,
                            isDisabled: true,
                          });

                          this._getTimeslots(
                            item.id,
                            item.serviceType.serviceTypeKey,
                          )
                            .then(result => {
                              this.setState({
                                serviceTimeslots: result,
                              });
                            })
                            .catch(error => {
                              console.error(
                                SCREEN,
                                '_getTimeslots: error....',
                                error,
                              );
                            });

                          this._getPhotos(
                            item.id,
                            item.serviceType.serviceTypeKey,
                          )
                            .then(result => {
                              this.setState({
                                servicePhotos: result,
                              });
                            })
                            .catch(error => {
                              console.error(
                                SCREEN,
                                '_getPhotos: error....',
                                error,
                              );
                            });

                          this.setState({
                            isServiceEditorVisible: true,
                            error: null,
                          });
                        }}>
                        <Icon name="edit" />
                      </Button>
                    </View>
                  </View>
                  <Divider styleName="line" />
                </View>
              )}
            />
          )}
        </View>

        <Modal
          style={{margin: 0}}
          isVisible={isServiceEditorVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackButtonPress={() => {
            if (isModified) {
              this.setState({
                isConfirmationVisible: true,
                confirmationAction: 'close',
                confirmationInfo: 'Leave Without Saving ?',
              });
            } else {
              this.setState({
                isServiceEditorVisible: false,
                isModified: false,
              });
            }
          }}>
          <NavigationBar
            style={{
              container: {elevation: 3, height: 56},
            }}
            styleName="inline"
            leftComponent={
              <Button
                styleName="sm-gutter-left"
                onPress={() => {
                  if (isModified) {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'close',
                      confirmationInfo: 'Leave Without Saving ?',
                    });
                  } else {
                    this.setState({
                      isServiceEditorVisible: false,
                      isModified: false,
                    });
                  }
                }}>
                <Icon name="close" />
              </Button>
            }
            centerComponent={
              <View style={{width: 240}}>
                <Subtitle styleName="h-center">
                  {selectedItemKey
                    ? 'EDIT SERVICE ITEM'
                    : 'CREATE SERVICE ITEM'}
                </Subtitle>
              </View>
            }
            rightComponent={
              selectedItemKey && (
                <Button
                  styleName="sm-gutter-right"
                  onPress={() => {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'delete',
                      confirmationInfo: 'Confirm to Delete ?',
                    });
                  }}>
                  <Caption style={{color: 'red'}}>DELETE</Caption>
                </Button>
              )
            }
          />

          <View
            style={{
              flex: 1,
              backgroundColor: 'white',
            }}>
            <ScrollView
              contentContainerStyle={{
                padding: 15,
              }}>
              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Service Name:</Caption>
                <View styleName="horizontal stretch">
                  <TextInput
                    style={{flex: 1, elevation: 3, textAlign: 'center'}}
                    value={serviceName || null}
                    placeholder="Service Name"
                    onChangeText={this._handleServiceName}
                  />
                </View>
                {error && error.errorType === 'serviceName' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Service Type:</Caption>
                <View styleName="horizontal stretch">
                  <Button
                    style={{elevation: 3}}
                    styleName={isDisabled ? 'full-width muted' : 'full-width'}
                    disabled={isDisabled}
                    onPress={() => {
                      this.setState({
                        isServicePickerVisible: true,
                      });
                    }}>
                    <Text>
                      {selectedServiceType
                        ? selectedServiceType.serviceTypeName
                        : 'Please Choose a Service Type'}
                    </Text>
                    <Icon name="drop-down" />
                  </Button>
                </View>
                {error && error.errorType === 'selectedServiceType' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Service Price:</Caption>
                <View styleName="horizontal stretch">
                  <TextInputMask
                    customTextInput={TextInput}
                    customTextInputProps={{
                      style: {
                        elevation: 3,
                        flex: 1,
                        color: 'red',
                        textAlign: 'center',
                      },
                    }}
                    type="money"
                    options={{
                      precision: 2,
                      separator: '.',
                      delimiter: ',',
                      unit: 'RM ',
                      suffixUnit: '',
                    }}
                    value={price || 0.0}
                    onChangeText={this._handleServicePrice}
                  />
                </View>
                {error && error.errorType === 'price' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch vertical v-center md-gutter-top lg-gutter-bottom">
                <View styleName="strectch horizontal v-center space-between sm-gutter-bottom">
                  <Caption>Service Booking Timeslots:</Caption>
                  {selectedItemKey && (
                    <Button
                      style={{paddingLeft: 5, paddingRight: 0}}
                      styleName="secondary"
                      onPress={() => {
                        this.setState({
                          isDateTimePickerVisible: true,
                        });
                      }}>
                      <Caption style={{color: 'white'}}>ADD</Caption>
                      <Icon style={{margin: 0}} name="plus-button" />
                    </Button>
                  )}
                </View>
                <Divider styleName="line" />

                {!serviceTimeslots && !selectedItemKey && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption style={{color: Colors.Dark}} styleName="h-center">
                      YOU MUST SAVE YOUR SERVICE FIRST BEFORE ADDING TIMESLOTS
                    </Caption>
                  </View>
                )}

                {!serviceTimeslots && selectedItemKey && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <ActivityIndicator size="small" color={Colors.Dark} />
                    <Caption styleName="md-gutter-left">LOADING...</Caption>
                  </View>
                )}

                {serviceTimeslots && serviceTimeslots.length <= 0 && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption styleName="h-center">
                      NO BOOKING TIMESLOTS AVAILABLE YET... PLEASE ADD BOOKING
                      TIMESLOTS...
                    </Caption>
                  </View>
                )}

                {serviceTimeslots &&
                  serviceTimeslots.length > 0 &&
                  serviceTimeslots.map(value => {
                    return (
                      <Row key={value.id}>
                        <Icon name="events" />
                        <Caption style={{color: Colors.Dark}}>
                          {moment(value.timeslot).format('hh:mm A')}
                        </Caption>
                        <Button
                          styleName="right-icon"
                          onPress={() => {
                            this._deleteTimeslot(value.id);
                          }}>
                          <Icon name="clear-text" />
                        </Button>
                      </Row>
                    );
                  })}
                <Divider styleName="line" />
              </View>

              <View styleName="stretch vertical v-center md-gutter-top lg-gutter-bottom">
                <View styleName="strectch horizontal v-center space-between sm-gutter-bottom">
                  <Caption>Service Photos:</Caption>
                  {servicePhotos && (
                    <Button
                      style={{paddingLeft: 5, paddingRight: 0}}
                      styleName="secondary"
                      onPress={this._addPhotos}>
                      <Caption style={{color: 'white'}}>ADD</Caption>
                      <Icon style={{margin: 0}} name="plus-button" />
                    </Button>
                  )}
                </View>

                <Divider styleName="line" />

                {!servicePhotos && !selectedItemKey && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption style={{color: Colors.Dark}} styleName="h-center">
                      YOU MUST SAVE YOUR VARIANTS FIRST BEFORE ADDING PHOTOS
                    </Caption>
                  </View>
                )}

                {!servicePhotos && selectedItemKey && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <ActivityIndicator size="small" color={Colors.Dark} />
                    <Caption styleName="md-gutter-left">LOADING...</Caption>
                  </View>
                )}

                {servicePhotos && servicePhotos.length <= 0 && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption styleName="h-center">
                      NO PHOTOS AVAILABLE YET... PLEASE ADD PHOTOS...
                    </Caption>
                  </View>
                )}

                {servicePhotos &&
                  servicePhotos.length > 0 &&
                  servicePhotos.map(value => (
                    <View
                      key={value.id}
                      styleName="flexible horizontal v-center">
                      <Lightbox
                        style={{
                          margin: 10,
                          padding: 5,
                          elevation: 3,
                          backgroundColor: '#f2f2f2',
                        }}
                        activeProps={{
                          style: {
                            flex: 1,
                            width: '100%',
                          },
                          resizeMode: 'contain',
                        }}>
                        <Image
                          styleName="medium"
                          source={{
                            uri: value.uri,
                          }}
                        />
                      </Lightbox>
                      <View styleName="flexible vertical v-center md-gutter">
                        <Button
                          style={{elevation: 3, padding: 15}}
                          onPress={() => {
                            this._deletePhotos(value.id);
                          }}>
                          <Caption style={{color: 'red'}}>DELETE</Caption>
                        </Button>
                      </View>
                    </View>
                  ))}
                <Divider styleName="line" />
              </View>
            </ScrollView>
            <View styleName="stretch horizontal md-gutter-left md-gutter-right md-gutter-bottom">
              <Button
                styleName="full-width"
                style={{elevation: 3}}
                onPress={() => {
                  if (isModified) {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'close',
                      confirmationInfo: 'Leave Without Saving ?',
                    });
                  } else {
                    this.setState({
                      isServiceEditorVisible: false,
                      isModified: false,
                    });
                  }
                }}>
                <Icon name="clear-text" />
                <Text>Cancel</Text>
              </Button>

              <Button
                styleName={
                  isModified ? 'full-width secondary' : 'full-width muted'
                }
                style={{elevation: 3}}
                disabled={!isModified}
                onPress={() => {
                  if (selectedItemKey) {
                    this._updateServiceItem().catch(error => {
                      this.setState({
                        error,
                      });
                    });
                  } else {
                    this._createServiceItem().catch(error => {
                      this.setState({
                        error,
                      });
                    });
                  }
                }}>
                <Icon name="checkbox-on" />
                <Text>Save</Text>
              </Button>
            </View>
          </View>
        </Modal>

        <Modal
          isVisible={isServicePickerVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackdropPress={() => {
            this.setState({
              isServicePickerVisible: false,
            });
          }}
          onBackButtonPress={() => {
            this.setState({
              isServicePickerVisible: false,
            });
          }}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 15,
            }}>
            <View styleName="stretch md-gutter-bottom">
              <Subtitle styleName="sm-gutter-bottom">SERVICE TYPES</Subtitle>
              <Divider styleName="line" />
            </View>

            <FlatList
              style={{flexGrow: 0}}
              data={serviceTypes}
              keyExtractor={item => item.serviceTypeKey}
              renderItem={({item}) => (
                <Button
                  style={{elevation: 3}}
                  styleName="secondary md-gutter-bottom"
                  onPress={() => {
                    this.setState({
                      selectedServiceType: item,
                      isServicePickerVisible: false,
                    });
                  }}>
                  <Text>{item.serviceTypeName}</Text>
                </Button>
              )}
            />
          </View>
        </Modal>

        <DateTimePicker
          mode="time"
          is24Hour={false}
          timePickerModeAndroid="spinner"
          isVisible={isDateTimePickerVisible}
          onConfirm={date => {
            console.log(SCREEN, 'DateTimePicker = ', date);
            this._addTimeslot(date);
          }}
          onCancel={() => {
            this.setState({
              isDateTimePickerVisible: false,
            });
          }}
        />

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
                  if (confirmationAction && confirmationAction === 'delete') {
                    this._deleteServiceItem();
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'close'
                  ) {
                    this.setState({
                      isServiceEditorVisible: false,
                      isModified: false,
                    });
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
