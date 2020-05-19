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

import RNFetchBlob from 'react-native-fetch-blob';
const Blob = RNFetchBlob.polyfill.Blob;
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
window.Blob = Blob;

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const STORAGE = firebase.storage();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'ManageMarketScreen: ';

export class ManageMarketScreen extends Component {
  static navigationOptions = ({navigation}) => {
    return {
      headerRight: (
        <Button
          style={{marginRight: 15, paddingLeft: 10}}
          styleName="secondary"
          onPress={navigation.getParam('toggleProductEditorVisible')}>
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
      productTypes: null,
      productItems: null,
      productPic: null,
      productName: null,
      productVariants: null,
      selectedProductType: null,
      selectedItemKey: null,
      selectedProductVariant: null,
      variantName: null,
      price: null,
      quantity: null,
      photos: null,
      isProductEditorVisible: false,
      isProductTypePickerVisible: false,
      isVariantEditorVisible: false,
      isLoaderVisible: false,
      isProductModified: false,
      isVariantModified: false,
      isConfirmationVisible: false,
      confirmationAction: null,
      confirmationInfo: null,
      error: null,
    };

    this._refresh = this._refresh.bind(this);
    this._getVariants = this._getVariants.bind(this);
    this._getPhotos = this._getPhotos.bind(this);
    this._handleProductPic = this._handleProductPic.bind(this);
    this._handleProductName = this._handleProductName.bind(this);
    this._handleVariantName = this._handleVariantName.bind(this);
    this._handleVariantPrice = this._handleVariantPrice.bind(this);
    this._handleVariantQuantity = this._handleVariantQuantity.bind(this);
    this._createProductItem = this._createProductItem.bind(this);
    this._updateProductItem = this._updateProductItem.bind(this);
    this._deleteProductItem = this._deleteProductItem.bind(this);
    this._createProductVariant = this._createProductVariant.bind(this);
    this._updateProductVariant = this._updateProductVariant.bind(this);
    this._deleteProductVariant = this._deleteProductVariant.bind(this);
    this._addVariantPhotos = this._addVariantPhotos.bind(this);
    this._deleteVariantPhotos = this._deleteVariantPhotos.bind(this);

    this._toggleProductEditorVisible = this._toggleProductEditorVisible.bind(
      this,
    );
  }

  componentDidMount() {
    try {
      this._fetchProducts();
    } catch (e) {
      console.error(SCREEN, '_fetchProducts: error...', e);
    }

    this.props.navigation.setParams({
      toggleProductEditorVisible: this._toggleProductEditorVisible,
    });
  }

  _toggleProductEditorVisible() {
    this.setState({
      selectedItemKey: null,
      productPic: null,
      productName: null,
      productVariants: null,
      selectedProductType: null,
      isProductEditorVisible: true,
      error: false,
    });
  }

  async _fetchProducts() {
    const TAG = '_fetchProducts: ';
    console.log(SCREEN, TAG, 'start... ');

    const currentUser = AUTH.currentUser;

    const products = [];

    const ProductTypesRef = DATABASE.collection('ProductTypes');
    try {
      var ProductTypes = await ProductTypesRef.get();
      console.log(SCREEN, TAG, 'ProductTypes = ', ProductTypes);
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'ProductTypes:error... ', e);
    }

    const productTypes = [];
    for (const ProductType of ProductTypes.docs) {
      const {productTypeKey, productTypeName} = ProductType.data();

      productTypes.push({
        productTypeKey,
        productTypeName,
      });

      const ProductItemsRef = await DATABASE.collection('Products')
        .where('stylistUid', '==', currentUser.uid)
        .where('productTypeKey', '==', productTypeKey)
        .get();
      console.log(SCREEN, TAG, 'ProductItemsRef = ', ProductItemsRef);

      if (!ProductItemsRef.empty) {
        const title = productTypeName;
        const data = [];
        for (const ProductItem of ProductItemsRef.docs) {
          data.push({
            id: ProductItem.id,
            productType: {
              productTypeKey,
              productTypeName,
            },
            ...ProductItem.data(),
          });
        }

        products.push({
          title,
          data,
        });
      }
    }

    console.log(SCREEN, TAG, 'products = ', products);

    this.setState({
      refreshing: false,
      productTypes,
      productItems: products,
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
      await this._fetchProducts();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, '_fetchProducts: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish...');
  }

  async _getVariants(productItemKey) {
    const TAG = '_getVariants: ';
    console.log(SCREEN, TAG, 'start... ');

    const ProductRef = DATABASE.collection('Products').doc(productItemKey);

    const VariantsRef = ProductRef.collection('Variants');

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

  async _getPhotos(productItemKey, productVariantKey) {
    const TAG = '_getPhotos: ';
    console.log(SCREEN, TAG, 'start... ');

    const ProductRef = DATABASE.collection('Products').doc(productItemKey);
    const VariantRef = ProductRef.collection('Variants').doc(productVariantKey);
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

  _handleProductPic() {
    const TAG = '_handleProductPic: ';

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
          isProductModified: true,
          productPic: `data:${response.type};base64,${response.data}`,
        });
      }
    });
  }

  _handleProductName(productName) {
    const TAG = '_handleProductName: ';
    console.log(SCREEN, TAG, 'productName = ', productName);

    this.setState({
      isProductModified: true,
      productName,
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

  _handleVariantQuantity(quantity) {
    const TAG = '_handleVariantQuantity: ';

    quantity = parseInt(quantity);
    console.log(SCREEN, TAG, 'quantity = ', quantity);

    this.setState({
      isVariantModified: true,
      quantity,
    });
  }

  async _validation(validationType) {
    const TAG = '_validation: ';
    console.log(SCREEN, TAG, 'start... ');

    var {
      productPic,
      productName,
      selectedProductType,
      variantName,
      price,
      quantity,
    } = this.state;

    if (validationType === 'PRODUCT') {
      if (!productPic) {
        const error = {
          errorType: 'productPic',
          errorMsg: 'Required ! ',
        };

        return Promise.reject(error);
      }

      if (!productName || productName === '') {
        const error = {
          errorType: 'productName',
          errorMsg: 'Required ! ',
        };

        return Promise.reject(error);
      }

      if (!selectedProductType) {
        const error = {
          errorType: 'selectedProductType',
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

      if (!quantity || quantity === '') {
        const error = {
          errorType: 'quantity',
          errorMsg: 'Required ! ',
        };
        return Promise.reject(error);
      } else {
        if (quantity < 0) {
          const error = {
            errorType: 'quantity',
            errorMsg: 'Invalid value ! ',
          };

          return Promise.reject(error);
        }
      }
    } else {
      return Promise.reject('Invalid Validation Type ! ');
    }

    this.setState({
      productName,
      selectedProductType,
      variantName,
      price,
      quantity,
    });

    console.log(SCREEN, TAG, 'finish... ');

    return Promise.resolve();
  }

  async _createProductItem() {
    const TAG = '_createProductItem: ';
    console.log(SCREEN, TAG, 'start... ');

    const validationType = 'PRODUCT';
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

    const {productPic, productName, selectedProductType} = this.state;

    const ProductRef = DATABASE.collection('Products');
    try {
      await ProductRef.add({
        productName,
        productPic,
        productTypeKey: selectedProductType.productTypeKey,
        productTypeName: selectedProductType.productTypeName,
        stylistUid: currentUser.uid,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchProducts().then(() => {
      ToastAndroid.show('Create Successful', ToastAndroid.LONG);

      this.setState({
        isProductEditorVisible: false,
        isLoaderVisible: false,
        isProductModified: false,
      });
    });
  }

  async _updateProductItem() {
    const TAG = '_updateProductItem: ';
    console.log(SCREEN, TAG, 'start... ');

    const validationType = 'PRODUCT';
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
      productPic,
      productName,
      selectedProductType,
      selectedItemKey,
    } = this.state;

    const ProductRef = DATABASE.collection('Products').doc(selectedItemKey);

    try {
      await ProductRef.update({
        productName,
        productPic,
        productTypeKey: selectedProductType.productTypeKey,
        productTypeName: selectedProductType.productTypeName,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchProducts().then(() => {
      ToastAndroid.show('Update Successful', ToastAndroid.LONG);

      this.setState({
        isProductEditorVisible: false,
        isLoaderVisible: false,
        isProductModified: false,
      });
    });
  }

  async _deleteProductItem() {
    const TAG = '_deleteProductItem: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
      error: null,
    });

    const {selectedItemKey} = this.state;

    const ProductRef = DATABASE.collection('Products').doc(selectedItemKey);

    try {
      await ProductRef.delete();
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    this._fetchProducts().then(() => {
      ToastAndroid.show('Delete Successful', ToastAndroid.LONG);

      this.setState({
        isProductEditorVisible: false,
        isLoaderVisible: false,
        isProductModified: false,
      });
    });
  }

  async _createProductVariant() {
    const TAG = '_createProductVariant: ';
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

    const {selectedItemKey, variantName, price, quantity} = this.state;

    const ProductRef = DATABASE.collection('Products').doc(selectedItemKey);

    const VariantRef = ProductRef.collection('Variants');

    try {
      await VariantRef.add({
        variantName,
        price,
        quantity,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    this._getVariants(selectedItemKey).then(result => {
      ToastAndroid.show('Create Successful', ToastAndroid.LONG);

      this.setState({
        productVariants: result,
        isVariantEditorVisible: false,
        isLoaderVisible: false,
        isVariantModified: false,
      });
    });
  }

  async _updateProductVariant() {
    const TAG = '_updateProductVariant: ';
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
      selectedProductVariant,
      variantName,
      price,
      quantity,
    } = this.state;

    const ProductRef = DATABASE.collection('Products').doc(selectedItemKey);

    const VariantRef = ProductRef.collection('Variants').doc(
      selectedProductVariant,
    );

    try {
      await VariantRef.update({
        variantName,
        price,
        quantity,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'error... ', e);
    }

    this._getVariants(selectedItemKey).then(result => {
      ToastAndroid.show('Update Successful', ToastAndroid.LONG);

      this.setState({
        productVariants: result,
        isVariantEditorVisible: false,
        isLoaderVisible: false,
        isVariantModified: false,
      });
    });
  }

  async _deleteProductVariant() {
    const TAG = '_deleteProductVariant: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    const {selectedItemKey, selectedProductVariant} = this.state;

    const ProductRef = DATABASE.collection('Products').doc(selectedItemKey);

    const VariantRef = ProductRef.collection('Variants').doc(
      selectedProductVariant,
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
        productVariants: result,
        isVariantEditorVisible: false,
        isLoaderVisible: false,
        isVariantModified: false,
      });
    });
  }

  async _addVariantPhotos() {
    const TAG = '_addVariantPhotos: ';
    console.log(SCREEN, TAG, 'start... ');

    const {selectedItemKey, selectedProductVariant} = this.state;

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

        const ProductRef = DATABASE.collection('Products').doc(selectedItemKey);

        const VariantRef = ProductRef.collection('Variants').doc(
          selectedProductVariant,
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
            productVariants: result,
          });
        });

        this._getPhotos(selectedItemKey, selectedProductVariant).then(
          result => {
            ToastAndroid.show(
              'Upload Successful and Auto Saved',
              ToastAndroid.LONG,
            );

            this.setState({
              isLoaderVisible: false,
              photos: result,
            });

            console.log(SCREEN, TAG, 'finish... ');
          },
        );
      }
    });
  }

  async _deleteVariantPhotos(photosUid) {
    const TAG = '_deleteVariantPhotos: ';
    console.log(SCREEN, TAG, 'start... ');

    this.setState({
      isLoaderVisible: true,
    });

    const {selectedItemKey, selectedProductVariant} = this.state;

    const ProductRef = DATABASE.collection('Products').doc(selectedItemKey);

    const VariantRef = ProductRef.collection('Variants').doc(
      selectedProductVariant,
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
        productVariants: result,
      });
    });

    this._getPhotos(selectedItemKey, selectedProductVariant).then(result => {
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
      productItems,
      productTypes,
      productPic,
      productName,
      productVariants,
      selectedItemKey,
      selectedProductType,
      selectedProductVariant,
      variantName,
      price,
      quantity,
      photos,
      isProductEditorVisible,
      isProductTypePickerVisible,
      isVariantEditorVisible,
      isLoaderVisible,
      isProductModified,
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
          {!productItems && (
            <View styleName="flexible stretch vertical v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="horizontal h-center sm-gutter-top">
                LOADING...
              </Caption>
            </View>
          )}

          {productItems && productItems.length <= 0 && (
            <View styleName="flexible stretch vertical v-center">
              <Caption styleName="horizontal h-center sm-gutter-top">
                EMPTY... PLEASE ADD PRODUCTS TO SELL...
              </Caption>
              <Button
                styleName="xl-gutter clear"
                onPress={() => {
                  this.setState({
                    productItems: null,
                  });

                  this._refresh();
                }}>
                <Icon name="refresh" />
                <Text>Tap here to refresh</Text>
              </Button>
            </View>
          )}

          {productItems && productItems.length > 0 && (
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
              sections={productItems}
              keyExtractor={item => item.id}
              renderSectionHeader={({section: {title}}) => (
                <View styleName="lg-gutter-top">
                  <Title styleName="md-gutter-bottom">{title}</Title>
                  <Divider styleName="section-header">
                    <Caption style={{color: Colors.Dark}}>PRODUCT</Caption>
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
                            uri: item.productPic,
                          }}
                        />
                      </View>
                    </View>
                    <View styleName="flexible">
                      <Caption style={{color: Colors.Dark}}>
                        {item.productName}
                      </Caption>
                    </View>
                    <View styleName="flexible horizontal h-end">
                      <Button
                        styleName="tight clear"
                        onPress={() => {
                          console.log(SCREEN, 'productUid = ', item.id);

                          this.setState({
                            productVariants: null,
                            selectedItemKey: item.id,
                            selectedProductType: item.productType,
                            productPic: item.productPic,
                            productName: item.productName,
                          });

                          this._getVariants(item.id)
                            .then(result => {
                              this.setState({
                                productVariants: result,
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
                            isProductEditorVisible: true,
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
          isVisible={isProductEditorVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackButtonPress={() => {
            if (isProductModified) {
              this.setState({
                isConfirmationVisible: true,
                confirmationAction: 'closeProductEditor',
                confirmationInfo: 'Leave Without Saving ?',
              });
            } else {
              this.setState({
                isProductEditorVisible: false,
                isProductModified: false,
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
                  if (isProductModified) {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'closeProductEditor',
                      confirmationInfo: 'Leave Without Saving ?',
                    });
                  } else {
                    this.setState({
                      isProductEditorVisible: false,
                      isProductModified: false,
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
                    ? 'EDIT PRODUCT ITEM'
                    : 'CREATE PRODUCT ITEM'}
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
                <Caption>Product Main Picture:</Caption>
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
                        uri: productPic,
                      }}
                    />
                  </Lightbox>
                </View>

                <View styleName="stretch md-gutter-top">
                  <Button
                    style={{elevation: 3}}
                    styleName="secondary full-width"
                    onPress={this._handleProductPic}>
                    <Text>TAP HERE TO CHANGE PRODUCT PIC</Text>
                  </Button>
                  {error && error.errorType === 'productPic' && (
                    <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                  )}
                </View>
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Product Name:</Caption>
                <View styleName="horizontal stretch">
                  <TextInput
                    style={{flex: 1, elevation: 3, textAlign: 'center'}}
                    value={productName || null}
                    placeholder="Product Name"
                    onChangeText={this._handleProductName}
                  />
                </View>
                {error && error.errorType === 'productName' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Product Type:</Caption>
                <View styleName="horizontal stretch">
                  <Button
                    style={{elevation: 3}}
                    styleName="full-width"
                    onPress={() => {
                      this.setState({
                        isProductTypePickerVisible: true,
                      });
                    }}>
                    <Text>
                      {selectedProductType
                        ? selectedProductType.productTypeName
                        : 'Please Choose a Service Type'}
                    </Text>
                    <Icon name="drop-down" />
                  </Button>
                </View>
                {error && error.errorType === 'selectedProductType' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch vertical v-center md-gutter-top lg-gutter-bottom">
                <View styleName="strectch horizontal v-center space-between sm-gutter-bottom">
                  <Caption>Product Variants:</Caption>
                  {selectedItemKey && (
                    <Button
                      style={{paddingLeft: 5, paddingRight: 0}}
                      styleName="secondary"
                      onPress={() => {
                        this.setState({
                          selectedProductVariant: null,
                          variantName: null,
                          price: 0.01,
                          quantity: 1,
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

                {!productVariants && !selectedItemKey && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption style={{color: Colors.Dark}} styleName="h-center">
                      YOU MUST SAVE YOUR PRODUCT FIRST BEFORE ADDING VARIANTS
                    </Caption>
                  </View>
                )}

                {!productVariants && selectedItemKey && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <ActivityIndicator size="small" color={Colors.Dark} />
                    <Caption styleName="md-gutter-left">LOADING...</Caption>
                  </View>
                )}

                {productVariants && productVariants.length <= 0 && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption styleName="h-center">
                      NO PRODUCT VARIANTS AVAILABLE YET... PLEASE ADD PRODUCT
                      VARIANTS...
                    </Caption>
                  </View>
                )}

                {productVariants &&
                  productVariants.length > 0 &&
                  productVariants.map(value => {
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
                              RM {value.price.toFixed(2)}
                            </Caption>
                          </View>
                          <View styleName="flexible horizontal h-end">
                            <Caption>{value.quantity} PCS</Caption>
                          </View>
                          <View styleName="flexible horizontal h-end">
                            <Button
                              styleName="tight clear"
                              onPress={() => {
                                console.log(
                                  SCREEN,
                                  'selectedProductVariant = ',
                                  value,
                                );

                                this.setState({
                                  selectedProductVariant: value.id,
                                  price: value.price,
                                  variantName: value.variantName,
                                  quantity: value.quantity,
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
                  if (isProductModified) {
                    this.setState({
                      isConfirmationVisible: true,
                      confirmationAction: 'closeProductEditor',
                      confirmationInfo: 'Leave Without Saving ?',
                    });
                  } else {
                    this.setState({
                      isProductEditorVisible: false,
                      isProductModified: false,
                    });
                  }
                }}>
                <Icon name="clear-text" />
                <Text>Cancel</Text>
              </Button>

              <Button
                styleName={
                  isProductModified
                    ? 'full-width secondary'
                    : 'full-width muted'
                }
                style={{elevation: 3}}
                disabled={!isProductModified}
                onPress={() => {
                  if (selectedItemKey) {
                    this._updateProductItem().catch(error => {
                      console.warn(
                        SCREEN,
                        '_updateProductItem: error... ',
                        error,
                      );

                      console.log(SCREEN, '_updateProductItem: finish... ');

                      this.setState({
                        error,
                      });
                    });
                  } else {
                    this._createProductItem().catch(error => {
                      console.warn(
                        SCREEN,
                        '_createProductItem: error... ',
                        error,
                      );

                      console.log(SCREEN, '_createProductItem: finish... ');

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
                  {selectedProductVariant
                    ? 'EDIT PRODUCT VARIANT'
                    : 'CREATE PRODUCT VARIANT'}
                </Subtitle>
              </View>
            }
            rightComponent={
              selectedProductVariant && (
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

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Quantity:</Caption>
                <View styleName="horizontal stretch">
                  <TextInputMask
                    customTextInput={TextInput}
                    customTextInputProps={{
                      style: {
                        elevation: 3,
                        flex: 1,
                        textAlign: 'center',
                      },
                    }}
                    type="only-numbers"
                    placeholder="0 PCS"
                    value={quantity || null}
                    onChangeText={this._handleVariantQuantity}
                  />
                </View>
                {error && error.errorType === 'quantity' && (
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

                {!photos && !selectedProductVariant && (
                  <View styleName="stretch horizontal h-center v-center lg-gutter-top lg-gutter-bottom">
                    <Caption style={{color: Colors.Dark}} styleName="h-center">
                      YOU MUST SAVE YOUR VARIANTS FIRST BEFORE ADDING PHOTOS
                    </Caption>
                  </View>
                )}

                {!photos && selectedProductVariant && (
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
                  if (selectedProductVariant) {
                    this._updateProductVariant().catch(error => {
                      console.warn(
                        SCREEN,
                        '_updateProductVariant: error... ',
                        error,
                      );

                      console.log(SCREEN, '_updateProductVariant: finish... ');

                      this.setState({
                        error,
                      });
                    });
                  } else {
                    this._createProductVariant().catch(error => {
                      console.warn(
                        SCREEN,
                        '_createProductVariant: error... ',
                        error,
                      );

                      console.log(SCREEN, '_createProductVariant: finish... ');

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
          isVisible={isProductTypePickerVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}
          onBackdropPress={() => {
            this.setState({
              isProductTypePickerVisible: false,
            });
          }}
          onBackButtonPress={() => {
            this.setState({
              isProductTypePickerVisible: false,
            });
          }}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 15,
            }}>
            <View styleName="stretch md-gutter-bottom">
              <Subtitle styleName="sm-gutter-bottom">PRODUCT TYPES</Subtitle>
              <Divider styleName="line" />
            </View>

            <FlatList
              style={{flexGrow: 0}}
              data={productTypes}
              keyExtractor={item => item.productTypeKey}
              renderItem={({item}) => (
                <Button
                  style={{elevation: 3}}
                  styleName="secondary md-gutter-bottom"
                  onPress={() => {
                    this.setState({
                      selectedProductType: item,
                      isProductTypePickerVisible: false,
                      isProductModified: true,
                    });
                  }}>
                  <Text>{item.productTypeName}</Text>
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
                      isProductEditorVisible: false,
                      isProductModified: false,
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
                    this._deleteProductItem();
                  } else if (
                    confirmationAction &&
                    confirmationAction === 'deleteVariant'
                  ) {
                    this._deleteProductVariant();
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
