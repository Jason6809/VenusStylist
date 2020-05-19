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
  Overlay,
  Divider,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import moment from 'moment';

import ImageResizer from 'react-native-image-resizer';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const STORAGE = firebase.storage();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'ManageRentalScreen: ';

export class ManageRentalScreen extends Component {
  static navigationOptions = ({navigation}) => {
    return {
      headerRight: (
        <Button
          style={{marginRight: 15, paddingLeft: 10}}
          styleName="secondary"
          onPress={navigation.getParam('toggleRentalItemEditorVisible')}>
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
      rentalItemTypes: null,
      rentalItems: null,
      itemPic: null,
      itemName: null,
      itemVariants: null,
      selectedRentalItemType: null,
      selectedItemKey: null,
      selectedItemVariant: null,
      variantName: null,
      price: null,
      photos: null,
      isRentalItemEditorVisible: false,
      isRentalItemTypePickerVisible: false,
      isVariantEditorVisible: false,
      isLoaderVisible: false,
      isRentalItemModified: false,
      isVariantModified: false,
      isConfirmationVisible: false,
      confirmationAction: null,
      confirmationInfo: null,
      error: null,
    };

    this._refresh = this._refresh.bind(this);
    this._getVariants = this._getVariants.bind(this);
    this._getPhotos = this._getPhotos.bind(this);
    this._handleItemPic = this._handleItemPic.bind(this);
    this._handleItemName = this._handleItemName.bind(this);
    this._handleVariantName = this._handleVariantName.bind(this);
    this._handleVariantPrice = this._handleVariantPrice.bind(this);
    this._createRentalItem = this._createRentalItem.bind(this);
    this._updateRentalItem = this._updateRentalItem.bind(this);
    this._deleteRentalItem = this._deleteRentalItem.bind(this);
    this._createItemVariant = this._createItemVariant.bind(this);
    this._updateItemVariant = this._updateItemVariant.bind(this);
    this._deleteItemVariant = this._deleteItemVariant.bind(this);
    this._addVariantPhotos = this._addVariantPhotos.bind(this);
    this._deleteVariantPhotos = this._deleteVariantPhotos.bind(this);

    this._toggleRentalItemEditorVisible = this._toggleRentalItemEditorVisible.bind(
      this,
    );
  }

  componentDidMount() {
    try {
      this._fetchRentalItems();
    } catch (e) {
      console.error(SCREEN, '_fetchRentalItems: error...', e);
    }

    this.props.navigation.setParams({
      toggleRentalItemEditorVisible: this._toggleRentalItemEditorVisible,
    });
  }

  _toggleRentalItemEditorVisible() {
    this.setState({
      selectedItemKey: null,
      itemPic: null,
      itemName: null,
      itemVariants: null,
      selectedRentalItemType: null,
      isRentalItemEditorVisible: true,
      error: false,
    });
  }

  async _fetchRentalItems() {
    const TAG = '_fetchRentalItems: ';
    console.log(SCREEN, TAG, 'start... ');

    const currentUser = AUTH.currentUser;

    const rentalItems = [];

    const RentalItemTypesRef = DATABASE.collection('RentalItemTypes');
    try {
      var RentalItemTypes = await RentalItemTypesRef.get();
      console.log(SCREEN, TAG, 'RentalItemTypes = ', RentalItemTypes);
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'RentalItemTypes:error... ', e);
    }

    const rentalItemTypes = [];
    for (const RentalItemType of RentalItemTypes.docs) {
      const {itemTypeKey, itemTypeName} = RentalItemType.data();

      rentalItemTypes.push({
        itemTypeKey,
        itemTypeName,
      });

      const RentalItemsRef = await DATABASE.collection('RentalItems')
        .where('stylistUid', '==', currentUser.uid)
        .where('itemTypeKey', '==', itemTypeKey)
        .get();
      console.log(SCREEN, TAG, 'RentalItemsRef = ', RentalItemsRef);

      if (!RentalItemsRef.empty) {
        const title = itemTypeName;
        const data = [];
        for (const RentalItem of RentalItemsRef.docs) {
          data.push({
            id: RentalItem.id,
            rentalItemType: {
              itemTypeKey,
              itemTypeName,
            },
            ...RentalItem.data(),
          });
        }

        rentalItems.push({
          title,
          data,
        });
      }
    }

    console.log(SCREEN, TAG, 'rentalItems = ', rentalItems);

    this.setState({
      refreshing: false,
      rentalItemTypes,
      rentalItems,
    });

    console.log(SCREEN, TAG, 'finish... ');
  }

  async _refresh() {
    const TAG = 'refresh: ';
    console.log(SCREEN, TAG, 'start...');

    this.setState({
      refreshing: true,
    });

    try {
      // statements
      await this._fetchRentalItems();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, '_fetchRentalItems: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish...');
  }

  async _getVariants(rentalItemKey) {
    const TAG = '_getVariants: ';
    console.log(SCREEN, TAG, 'start... ');

    const RentalItemRef = DATABASE.collection('RentalItems').doc(rentalItemKey);

    const VariantsRef = RentalItemRef.collection('Variants');

    try {
      var Variants = await VariantsRef.orderBy('price').get();
      console.log(SCREEN, TAG, 'Variants = ', Variants);
    } catch (e) {
      console.log(SCREEN, TAG, 'Variants: error... ', e);
      return Promise.reject(e);
    }

    const variants = [];
    for (const Variant of Variants.docs) {
      const PhotosRef = VariantsRef.doc(Variant.id).collection('Photos');

      try {
        var Photos = await PhotosRef.get();
        console.log(SCREEN, TAG, 'Photos = ', Photos);
      } catch (e) {
        // statements
        console.error(SCREEN, TAG, 'Photos: error... ', e);
        return Promise.reject(e);
      }

      if (Photos.empty) {
        variants.push({
          id: Variant.id,
          photos: null,
          ...Variant.data(),
        });
      } else {
        variants.push({
          id: Variant.id,
          photos: Photos.docs,
          ...Variant.data(),
        });
      }
    }

    console.log(SCREEN, TAG, 'variants = ', variants);

    return variants;
  }

  async _getPhotos(rentalItemKey, itemVariantKey) {
    const TAG = '_getPhotos: ';
    console.log(SCREEN, TAG, 'start... ');

    const RentalItemRef = DATABASE.collection('RentalItems').doc(rentalItemKey);
    const VariantRef = RentalItemRef.collection('Variants').doc(itemVariantKey);
    const PhotosRef = VariantRef.collection('Photos');

    try {
      var Photos = await PhotosRef.get();
      console.log(SCREEN, TAG, 'Photos = ', Photos);
    } catch (e) {
      console.error(SCREEN, TAG, 'Photos: error... ', e);
      return Promise.reject(e);
    }

    const photos = [];
    for (const Photo of Photos.docs) {
      photos.push({
        id: Photo.id,
        ...Photo.data(),
      });
    }

    console.log(SCREEN, TAG, 'photos = ', photos);

    return photos;
  }

  _handleItemPic() {
    const TAG = '_handleItemPic: ';

    ImagePicker.showImagePicker({maxWidth: 512}, response => {
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

        this.setState({
          isRentalItemModified: true,
          itemPic: `data:${response.type};base64,${response.data}`,
        });
      }
    });
  }

  _handleItemName(itemName) {
    const TAG = '_handleItemName: ';
    console.log(SCREEN, TAG, 'itemName = ', itemName);

    this.setState({
      isRentalItemModified: true,
      itemName,
    });
  }

  _handleVariantName(variantName) {
    const TAG = '_handleVariantName: ';
    console.log(SCREEN, TAG, 'variantName = ', variantName);

    this.setState({
      isVariantModified: true,
      variantName,
    });
  }

  _handleVariantPrice(price) {
    const TAG = '_handleVariantPrice: ';

    price = parseFloat(price.replace(/[^\d\.]/g, ''));
    console.log(SCREEN, TAG, 'price = ', price);

    this.setState({
      isVariantModified: true,
      price,
    });
  }

  async _validation(validationType) {
    const TAG = '_validation: ';
    console.log(SCREEN, TAG, 'start... ');

    var {
      itemPic,
      itemName,
      selectedRentalItemType,
      variantName,
      price,
    } = this.state;

    if (validationType === 'RENTAL') {
      if (!itemPic) {
        const error = {
          errorType: 'itemPic',
          errorMsg: 'Required ! ',
        };

        return Promise.reject(error);
      }

      if (!itemName || itemName === '') {
        const error = {
          errorType: 'itemName',
          errorMsg: 'Required ! ',
        };

        return Promise.reject(error);
      }

      if (!selectedRentalItemType) {
        const error = {
          errorType: 'selectedRentalItemType',
          errorMsg: 'Required ! ',
        };

        return Promise.reject(error);
      }
    } else if (validationType === 'VARIANT') {
      if (!variantName || variantName === '') {
        const error = {
          errorType: 'variantName',
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
    } else {
      return Promise.reject('Invalid Validation Type ! ');
    }

    this.setState({
      itemName,
      selectedRentalItemType,
      variantName,
      price,
    });

    console.log(SCREEN, TAG, 'finish... ');

    return Promise.resolve();
  }

  async _createRentalItem() {
    const TAG = '_createRentalItem: ';
    console.log(SCREEN, TAG, 'start... ');

    const validationType = 'RENTAL';
    try {
      await this._validation(validationType);
    } catch (e) {
      // statements
      return Promise.reject(e);
    }

    this.setState({
      isLoaderVisible: true,
      error: null,
    });

    const currentUser = AUTH.currentUser;

    const {itemPic, itemName, selectedRentalItemType} = this.state;

    const RentalItemRef = DATABASE.collection('RentalItems');
    try {
      await RentalItemRef.add({
        itemName,
        itemPic,
        itemTypeKey: selectedRentalItemType.itemTypeKey,
        itemTypeName: selectedRentalItemType.itemTypeName,
        stylistUid: currentUser.uid,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchRentalItems().then(() => {
      ToastAndroid.show('Create Successful', ToastAndroid.LONG);

      this.setState({
        isRentalItemEditorVisible: false,
        isLoaderVisible: false,
        isRentalItemModified: false,
      });
    });
  }

  async _updateRentalItem() {
    const TAG = '_updateRentalItem: ';
    console.log(SCREEN, TAG, 'start... ');

    const validationType = 'RENTAL';
    try {
      await this._validation(validationType);
    } catch (e) {
      // statements
      return Promise.reject(e);
    }

    this.setState({
      isLoaderVisible: true,
      error: null,
    });

    const {
      itemPic,
      itemName,
      selectedRentalItemType,
      selectedItemKey,
    } = this.state;

    const RentalItemRef = DATABASE.collection('RentalItems').doc(
      selectedItemKey,
    );

    try {
      await RentalItemRef.update({
        itemName,
        itemPic,
        itemTypeKey: selectedRentalItemType.itemTypeKey,
        itemTypeName: selectedRentalItemType.itemTypeName,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchRentalItems().then(() => {
      ToastAndroid.show('Update Successful', ToastAndroid.LONG);

      this.setState({
        isRentalItemEditorVisible: false,
        isLoaderVisible: false,
        isRentalItemModified: false,
      });
    });
  }

  async _deleteRentalItem() {
    const TAG = '_deleteRentalItem: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
      error: null,
    });

    const {selectedItemKey} = this.state;

    const RentalItemRef = DATABASE.collection('RentalItems').doc(
      selectedItemKey,
    );

    try {
      await RentalItemRef.delete();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchRentalItems().then(() => {
      ToastAndroid.show('Delete Successful', ToastAndroid.LONG);

      this.setState({
        isRentalItemEditorVisible: false,
        isLoaderVisible: false,
        isRentalItemModified: false,
      });
    });
  }

  async _createItemVariant() {
    const TAG = '_createItemVariant: ';
    console.log(SCREEN, TAG, 'start... ');

    const validationType = 'VARIANT';
    try {
      await this._validation(validationType);
    } catch (e) {
      return Promise.reject(e);
    }

    this.setState({
      isLoaderVisible: true,
    });

    const {selectedItemKey, variantName, price} = this.state;

    const RentalItemRef = DATABASE.collection('RentalItems').doc(
      selectedItemKey,
    );

    const VariantRef = RentalItemRef.collection('Variants');

    try {
      await VariantRef.add({
        variantName,
        price,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    this._getVariants(selectedItemKey).then(result => {
      ToastAndroid.show('Create Successful', ToastAndroid.LONG);

      this.setState({
        itemVariants: result,
        isVariantEditorVisible: false,
        isLoaderVisible: false,
        isVariantModified: false,
      });
    });
  }

  async _updateItemVariant() {
    const TAG = '_updateItemVariant: ';
    console.log(SCREEN, TAG, 'start... ');

    const validationType = 'VARIANT';
    try {
      await this._validation(validationType);
    } catch (e) {
      return Promise.reject(e);
    }

    this.setState({
      isLoaderVisible: true,
    });

    const {
      selectedItemKey,
      selectedItemVariant,
      variantName,
      price,
    } = this.state;

    const RentalItemRef = DATABASE.collection('RentalItems').doc(
      selectedItemKey,
    );

    const VariantRef = RentalItemRef.collection('Variants').doc(
      selectedItemVariant,
    );

    try {
      await VariantRef.update({
        variantName,
        price,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    this._getVariants(selectedItemKey).then(result => {
      ToastAndroid.show('Update Successful', ToastAndroid.LONG);

      this.setState({
        itemVariants: result,
        isVariantEditorVisible: false,
        isLoaderVisible: false,
        isVariantModified: false,
      });
    });
  }

  async _deleteItemVariant() {
    const TAG = '_deleteItemVariant: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    const {selectedItemKey, selectedItemVariant} = this.state;

    const RentalItemRef = DATABASE.collection('RentalItems').doc(
      selectedItemKey,
    );

    const VariantRef = RentalItemRef.collection('Variants').doc(
      selectedItemVariant,
    );

    try {
      await VariantRef.delete();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    this._getVariants(selectedItemKey).then(result => {
      ToastAndroid.show('Delete Successful', ToastAndroid.LONG);

      this.setState({
        itemVariants: result,
        isVariantEditorVisible: false,
        isLoaderVisible: false,
        isVariantModified: false,
      });
    });
  }

  async _addVariantPhotos() {
    const TAG = '_addVariantPhotos: ';
    console.log(SCREEN, TAG, 'start... ');

    const {selectedItemKey, selectedItemVariant} = this.state;

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

        const RentalItemRef = DATABASE.collection('RentalItems').doc(
          selectedItemKey,
        );

        const VariantRef = RentalItemRef.collection('Variants').doc(
          selectedItemVariant,
        );

        const PhotosRef = VariantRef.collection('Photos');

        try {
          // statements
          await PhotosRef.add({
            uri,
          });
        } catch (e) {
          // statements
          this.setState({
            isLoaderVisible: false,
          });
          return Promise.reject(e);
        }

        this._getVariants(selectedItemKey).then(result => {
          this.setState({
            itemVariants: result,
          });
        });

        this._getPhotos(selectedItemKey, selectedItemVariant).then(result => {
          ToastAndroid.show(
            'Upload Successful and Auto Saved',
            ToastAndroid.LONG,
          );

          this.setState({
            isLoaderVisible: false,
            photos: result,
          });

          console.log(SCREEN, TAG, 'finish... ');
        });
      }
    });
  }

  async _deleteVariantPhotos(photosUid) {
    const TAG = '_deleteVariantPhotos: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    const {selectedItemKey, selectedItemVariant} = this.state;

    const RentalItemRef = DATABASE.collection('RentalItems').doc(
      selectedItemKey,
    );

    const VariantRef = RentalItemRef.collection('Variants').doc(
      selectedItemVariant,
    );

    const PhotosRef = VariantRef.collection('Photos').doc(photosUid);

    try {
      await PhotosRef.delete();
    } catch (e) {
      // statements
      return Promise.reject(e);
    }

    this._getVariants(selectedItemKey).then(result => {
      this.setState({
        itemVariants: result,
      });
    });

    this._getPhotos(selectedItemKey, selectedItemVariant).then(result => {
      ToastAndroid.show('Delete Successful and Auto Saved', ToastAndroid.LONG);

      this.setState({
        isLoaderVisible: false,
        photos: result,
      });

      console.log(SCREEN, TAG, 'finish... ');
    });
  }

  componentWillUnmount() {}

  render() {
    const {
      refreshing,
      rentalItemTypes,
      rentalItems,
      itemPic,
      itemName,
      itemVariants,
      selectedRentalItemType,
      selectedItemKey,
      selectedItemVariant,
      variantName,
      price,
      photos,
      isRentalItemEditorVisible,
      isRentalItemTypePickerVisible,
      isVariantEditorVisible,
      isLoaderVisible,
      isRentalItemModified,
      isVariantModified,
      isConfirmationVisible,
      confirmationAction,
      confirmationInfo,
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
          {!rentalItems && (
            <View styleName="flexible stretch vertical v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="horizontal h-center sm-gutter-top">
                LOADING...
              </Caption>
            </View>
          )}

          {rentalItems && rentalItems.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                EMPTY... PLEASE ADD RENTAL ITEM TO RENT...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  this.setState({
                    rentalItems: null,
                  });

                  this._refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {rentalItems && rentalItems.length > 0 && (
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
              sections={rentalItems}
              keyExtractor={item => item.id}
              renderSectionHeader={({section: {title}}) => (
                <View styleName="lg-gutter-top">
                  <Title styleName="md-gutter-bottom">{title}</Title>
                  <Divider styleName="section-header">
                    <Caption style={{color: Colors.Dark}}>RENTAL ITEM</Caption>
                    <Caption style={{color: Colors.Dark}}>EDIT</Caption>
                  </Divider>
                </View>
              )}
              renderItem={({item}) => (
                <View>
                  <Divider styleName="line" />
                  <View styleName="md-gutter horizontal v-center space-between">
                    <View styleName="flexible">
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          padding: 5,
                          elevation: 3,
                          backgroundColor: '#f2f2f2',
                        }}>
                        <Image
                          styleName="small"
                          source={{
                            uri: item.itemPic,
                          }}
                        />
                      </View>
                    </View>
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {item.itemName}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Button
                        styleName="tight clear"
                        onPress={() => {
                          console.log(SCREEN, 'rentalItemUid = ', item.id);

                          this.setState({
                            itemVariants: null,
                            selectedItemKey: item.id,
                            selectedRentalItemType: item.rentalItemType,
                            itemPic: item.itemPic,
                            itemName: item.itemName,
                          });

                          this._getVariants(item.id)
                            .then(result => {
                              this.setState({
                                itemVariants: result,
                              });
                            })
                            .catch(error => {
                              console.error(
                                SCREEN,
                                '_getVariants: error....',
                                error,
                              );
                            });

                          this.setState({
                            isRentalItemEditorVisible: true,
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
          isVisible={isRentalItemEditorVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackButtonPress={() => {
            if (isRentalItemModified) {
              this.setState({
                isConfirmationVisible: true,
                confirmationAction: 'closeProductEditor',
                confirmationInfo: 'Leave Without Saving ?',
              });
            } else {
              this.setState({
                isRentalItemEditorVisible: false,
                isRentalItemModified: false,
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
                  if (isRentalItemModified) {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'closeProductEditor',
                      confirmationInfo: 'Leave Without Saving ?',
                    });
                  } else {
                    this.setState({
                      isRentalItemEditorVisible: false,
                      isRentalItemModified: false,
                    });
                  }
                }}>
                <Icon name="close" />
              </Button>
            }
            centerComponent={
              <View style={{width: 240}}>
                <Subtitle styleName="h-center">
                  {selectedItemKey ? 'EDIT RENTAL ITEM' : 'CREATE RENTAL ITEM'}
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
                      confirmationAction: 'deleteProduct',
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
                <Caption>Rental Item Main Picture:</Caption>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    paddingTop: 5,
                  }}>
                  <Lightbox
                    style={{
                      elevation: 3,
                      padding: 5,
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
                      style={{backgroundColor: '#f2f2f2'}}
                      styleName="medium-square"
                      source={{
                        uri: itemPic,
                      }}
                    />
                  </Lightbox>
                </View>

                <View styleName="stretch md-gutter-top">
                  <Button
                    style={{elevation: 3}}
                    styleName="secondary full-width"
                    onPress={this._handleItemPic}>
                    <Text>TAP HERE TO CHANGE RENTAL ITEM PIC</Text>
                  </Button>
                  {error && error.errorType === 'itemPic' && (
                    <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                  )}
                </View>
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Rental Item Name:</Caption>
                <View styleName="horizontal stretch">
                  <TextInput
                    style={{flex: 1, elevation: 3, textAlign: 'center'}}
                    value={itemName || null}
                    placeholder="Rental Item Name"
                    onChangeText={this._handleItemName}
                  />
                </View>
                {error && error.errorType === 'itemName' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Rental Item Type:</Caption>
                <View styleName="horizontal stretch">
                  <Button
                    style={{elevation: 3}}
                    styleName="full-width"
                    onPress={() => {
                      this.setState({
                        isRentalItemTypePickerVisible: true,
                      });
                    }}>
                    <Text>
                      {selectedRentalItemType
                        ? selectedRentalItemType.itemTypeName
                        : 'Please Choose a Rental Item Type'}
                    </Text>
                    <Icon name="drop-down" />
                  </Button>
                </View>
                {error && error.errorType === 'selectedRentalItemType' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch vertical v-center md-gutter-top lg-gutter-bottom">
                <View styleName="strectch horizontal v-center space-between sm-gutter-bottom">
                  <Caption>Rental Item Variants:</Caption>
                  {selectedItemKey && (
                    <Button
                      style={{paddingLeft: 5, paddingRight: 0}}
                      styleName="secondary"
                      onPress={() => {
                        this.setState({
                          selectedItemVariant: null,
                          variantName: null,
                          price: 0.01,

                          photos: null,
                          isVariantEditorVisible: true,
                          error: false,
                        });
                      }}>
                      <Caption style={{color: 'white'}}>ADD</Caption>
                      <Icon style={{margin: 0}} name="plus-button" />
                    </Button>
                  )}
                </View>
                <Divider styleName="line" />

                {!itemVariants && !selectedItemKey && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption style={{color: Colors.Dark}} styleName="h-center">
                      YOU MUST SAVE YOUR RENTAL ITEM FIRST BEFORE ADDING
                      VARIANTS
                    </Caption>
                  </View>
                )}

                {!itemVariants && selectedItemKey && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <ActivityIndicator size="small" color={Colors.Dark} />
                    <Caption styleName="md-gutter-left">LOADING...</Caption>
                  </View>
                )}

                {itemVariants && itemVariants.length <= 0 && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption styleName="h-center">
                      NO VARIANTS AVAILABLE YET... PLEASE ADD VARIANTS...
                    </Caption>
                  </View>
                )}

                {itemVariants &&
                  itemVariants.length > 0 &&
                  itemVariants.map(value => {
                    return (
                      <View key={value.id}>
                        <Divider styleName="line" />
                        <View styleName="md-gutter horizontal v-center space-between">
                          <View styleName="flexible">
                            <Caption style={{color: Colors.Dark}}>
                              {value.variantName}
                            </Caption>
                          </View>
                          <View styleName="flexible horizontal h-center">
                            <Caption style={{color: 'red'}}>
                              RM {value.price.toFixed(2)} / day
                            </Caption>
                          </View>
                          <View styleName="flexible horizontal h-end">
                            <Button
                              styleName="tight clear"
                              onPress={() => {
                                console.log(
                                  SCREEN,
                                  'selectedItemVariant = ',
                                  value,
                                );

                                this.setState({
                                  selectedItemVariant: value.id,
                                  price: value.price,
                                  variantName: value.variantName,

                                  photos: null,
                                });

                                this._getPhotos(selectedItemKey, value.id)
                                  .then(result => {
                                    this.setState({
                                      photos: result,
                                    });
                                  })
                                  .catch(error => {
                                    console.error(
                                      SCREEN,
                                      '_getPhotos: error...',
                                      error,
                                    );
                                  });

                                this.setState({
                                  isVariantEditorVisible: true,
                                  error: null,
                                });
                              }}>
                              <Icon name="edit" />
                            </Button>
                          </View>
                        </View>

                        {!value.photos && (
                          <View
                            styleName="flexible stretch"
                            style={{
                              padding: 5,
                              height: 109,
                            }}>
                            <View styleName="flexible stretch vertical v-center h-center">
                              <Caption>
                                SORRY... NO PHOTOS AVAILABLE YET...
                              </Caption>
                            </View>
                          </View>
                        )}

                        {value.photos && (
                          <FlatList
                            horizontal={true}
                            contentContainerStyle={{
                              paddingBottom: 5,
                            }}
                            data={value.photos}
                            keyExtractor={item => item.id}
                            renderItem={({item}) => (
                              <Lightbox
                                style={{
                                  marginTop: 1,
                                  marginBottom: 10,
                                  marginLeft: 5,
                                  marginRight: 5,
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
                                  styleName="small"
                                  source={{
                                    uri: item.data().uri,
                                  }}
                                />
                              </Lightbox>
                            )}
                          />
                        )}

                        <Divider styleName="line" />
                      </View>
                    );
                  })}
                <Divider styleName="line" />
              </View>
            </ScrollView>
            <View styleName="stretch horizontal md-gutter-left md-gutter-right md-gutter-bottom">
              <Button
                styleName="full-width"
                style={{elevation: 3}}
                onPress={() => {
                  if (isRentalItemModified) {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'closeProductEditor',
                      confirmationInfo: 'Leave Without Saving ?',
                    });
                  } else {
                    this.setState({
                      isRentalItemEditorVisible: false,
                      isRentalItemModified: false,
                    });
                  }
                }}>
                <Icon name="clear-text" />
                <Text>Cancel</Text>
              </Button>

              <Button
                styleName={
                  isRentalItemModified
                    ? 'full-width secondary'
                    : 'full-width muted'
                }
                style={{elevation: 3}}
                disabled={!isRentalItemModified}
                onPress={() => {
                  if (selectedItemKey) {
                    this._updateRentalItem().catch(error => {
                      console.warn(
                        SCREEN,
                        '_updateRentalItem: error... ',
                        error,
                      );

                      console.log(SCREEN, '_updateRentalItem: finish... ');

                      this.setState({
                        error,
                      });
                    });
                  } else {
                    this._createRentalItem().catch(error => {
                      console.warn(
                        SCREEN,
                        '_createRentalItem: error... ',
                        error,
                      );

                      console.log(SCREEN, '_createRentalItem: finish... ');

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
          style={{margin: 0}}
          isVisible={isVariantEditorVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackButtonPress={() => {
            if (isVariantModified) {
              this.setState({
                isConfirmationVisible: true,
                confirmationAction: 'closeVariantEditor',
                confirmationInfo: 'Leave Without Saving ?',
              });
            } else {
              this.setState({
                isVariantEditorVisible: false,
                isVariantModified: false,
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
                  if (isVariantModified) {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'closeVariantEditor',
                      confirmationInfo: 'Leave Without Saving ?',
                    });
                  } else {
                    this.setState({
                      isVariantEditorVisible: false,
                      isVariantModified: false,
                    });
                  }
                }}>
                <Icon name="close" />
              </Button>
            }
            centerComponent={
              <View style={{width: 240}}>
                <Subtitle styleName="h-center">
                  {selectedItemVariant
                    ? 'EDIT RENTAL ITEM VARIANT'
                    : 'CREATE RENTAL ITEM VARIANT'}
                </Subtitle>
              </View>
            }
            rightComponent={
              selectedItemVariant && (
                <Button
                  styleName="sm-gutter-right"
                  onPress={() => {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'deleteVariant',
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
                <Caption>Variant Name:</Caption>
                <View styleName="horizontal stretch">
                  <TextInput
                    style={{flex: 1, elevation: 3, textAlign: 'center'}}
                    value={variantName || null}
                    placeholder="Variant Name"
                    onChangeText={this._handleVariantName}
                  />
                </View>
                {error && error.errorType === 'variantName' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Price:</Caption>
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
                    value={price || null}
                    onChangeText={this._handleVariantPrice}
                  />
                </View>
                {error && error.errorType === 'price' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch vertical v-center md-gutter-top lg-gutter-bottom">
                <View styleName="strectch horizontal v-center space-between sm-gutter-bottom">
                  <Caption>Photos:</Caption>
                  {photos && (
                    <Button
                      style={{paddingLeft: 5, paddingRight: 0}}
                      styleName="secondary"
                      onPress={this._addVariantPhotos}>
                      <Caption style={{color: 'white'}}>ADD</Caption>
                      <Icon style={{margin: 0}} name="plus-button" />
                    </Button>
                  )}
                </View>

                <Divider styleName="line" />

                {!photos && !selectedItemVariant && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption style={{color: Colors.Dark}} styleName="h-center">
                      YOU MUST SAVE YOUR VARIANTS FIRST BEFORE ADDING PHOTOS
                    </Caption>
                  </View>
                )}

                {!photos && selectedItemVariant && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <ActivityIndicator size="small" color={Colors.Dark} />
                    <Caption styleName="md-gutter-left">LOADING...</Caption>
                  </View>
                )}

                {photos && photos.length <= 0 && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption styleName="h-center">
                      NO PHOTOS AVAILABLE YET... PLEASE ADD PHOTOS...
                    </Caption>
                  </View>
                )}

                {photos &&
                  photos.length > 0 &&
                  photos.map(value => (
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
                            this._deleteVariantPhotos(value.id);
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
                  if (isVariantModified) {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'closeVariantEditor',
                      confirmationInfo: 'Leave Without Saving ?',
                    });
                  } else {
                    this.setState({
                      isVariantEditorVisible: false,
                      isVariantModified: false,
                    });
                  }
                }}>
                <Icon name="clear-text" />
                <Text>Cancel</Text>
              </Button>

              <Button
                styleName={
                  isVariantModified
                    ? 'full-width secondary'
                    : 'full-width muted'
                }
                style={{elevation: 3}}
                disabled={!isVariantModified}
                onPress={() => {
                  if (selectedItemVariant) {
                    this._updateItemVariant().catch(error => {
                      console.warn(
                        SCREEN,
                        '_updateItemVariant: error... ',
                        error,
                      );

                      console.log(SCREEN, '_updateItemVariant: finish... ');

                      this.setState({
                        error,
                      });
                    });
                  } else {
                    this._createItemVariant().catch(error => {
                      console.warn(
                        SCREEN,
                        '_createItemVariant: error... ',
                        error,
                      );

                      console.log(SCREEN, '_createItemVariant: finish... ');

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
          isVisible={isRentalItemTypePickerVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackdropPress={() => {
            this.setState({
              isRentalItemTypePickerVisible: false,
            });
          }}
          onBackButtonPress={() => {
            this.setState({
              isRentalItemTypePickerVisible: false,
            });
          }}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 15,
            }}>
            <View styleName="stretch md-gutter-bottom">
              <Subtitle styleName="sm-gutter-bottom">
                RENTAL ITEM TYPES
              </Subtitle>
              <Divider styleName="line" />
            </View>

            <FlatList
              style={{flexGrow: 0}}
              data={rentalItemTypes}
              keyExtractor={item => item.itemTypeKey}
              renderItem={({item}) => (
                <Button
                  style={{elevation: 3}}
                  styleName="secondary md-gutter-bottom"
                  onPress={() => {
                    this.setState({
                      selectedRentalItemType: item,
                      isRentalItemTypePickerVisible: false,
                      isRentalItemModified: true,
                    });
                  }}>
                  <Text>{item.itemTypeName}</Text>
                </Button>
              )}
            />
          </View>
        </Modal>

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
                  if (
                    confirmationAction &&
                    confirmationAction === 'closeProductEditor'
                  ) {
                    this.setState({
                      isRentalItemEditorVisible: false,
                      isRentalItemModified: false,
                    });
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'closeVariantEditor'
                  ) {
                    this.setState({
                      isVariantEditorVisible: false,
                      isVariantModified: false,
                    });
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'deleteProduct'
                  ) {
                    this._deleteRentalItem();
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'deleteVariant'
                  ) {
                    this._deleteItemVariant();
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
