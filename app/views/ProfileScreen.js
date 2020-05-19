import React, {Component} from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import Modal from 'react-native-modal';
import ImagePicker from 'react-native-image-picker';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  TextInput,
  Caption,
  Tile,
  Button,
  Icon,
  Row,
  TouchableOpacity,
  Card,
  Image,
  ImageBackground,
  Overlay,
  Lightbox,
  Divider,
} from '@shoutem/ui';

import Colors from '../constants/Colors';

import moment from 'moment';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const STORAGE = firebase.storage();
const FUNCTIONS = firebase.functions();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const SCREEN = 'ProfileScreen: ';

export class ProfileScreen extends Component {
  constructor(props) {
    super(props);
    console.log(SCREEN, 'props = ', props);

    const {userProfile} = props.navigation.state.params;

    this.onUserProfileSnapshot = null;

    this.state = {
      profilePic: userProfile.profile.profilePic,
      firstName: userProfile.profile.firstName,
      lastName: userProfile.profile.lastName,
      email: userProfile.email,
      isLoaderVisible: false,
      isConfirmationVisible: false,
      confirmationInfo: null,
      error: null,
      statusBarColor: Colors.Misty_Rose,
      isModified: false,
    };

    this._handleProfilePic = this._handleProfilePic.bind(this);
    this._handleFirstName = this._handleFirstName.bind(this);
    this._handleLasttName = this._handleLasttName.bind(this);
    this._updateUserProfile = this._updateUserProfile.bind(this);
  }

  componentDidMount() {
    this._getUserProfile();
  }

  _getUserProfile() {
    const TAG = 'getUserProfile: ';

    const currentUser = AUTH.currentUser;

    this.onUserProfileSnapshot = DATABASE.collection('Users')
      .doc(currentUser.uid)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            console.log(SCREEN, TAG, 'doc = ', doc.data());

            const {email, profile} = doc.data();

            this.setState({
              email,
              ...profile,
            });
          } else {
            console.error(SCREEN, TAG, 'Doc is not exist...');
          }
        },
        error => {
          console.error(SCREEN, TAG, 'error = ', error);
        },
      );
  }

  _handleProfilePic() {
    const TAG = '_handleProfilePic: ';

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
          isModified: true,
          profilePic: `data:${response.type};base64,${response.data}`,
        });
      }
    });
  }

  _handleFirstName(firstName) {
    const TAG = '_handleFirstName: ';
    console.log(SCREEN, TAG, 'firstName = ', firstName);

    this.setState({
      firstName,
      isModified: true,
    });
  }

  _handleLasttName(lastName) {
    const TAG = '_handleFirstName: ';
    console.log(SCREEN, TAG, 'lastName = ', lastName);

    this.setState({
      lastName,
      isModified: true,
    });
  }

  _handleEmail(email) {
    const TAG = '_handleFirstName: ';
    console.log(SCREEN, TAG, 'email = ', email);

    this.setState({
      email,
      isModified: true,
    });
  }

  async _validation() {
    const TAG = '_validation: ';
    console.log(SCREEN, TAG, 'start... ');

    var {firstName, lastName, email} = this.state;

    if (!firstName || firstName === '') {
      const error = {
        errorType: 'displayName',
        errorMsg: 'First Name is Required ! ',
      };

      return Promise.reject(error);
    }

    if (!lastName || lastName === '') {
      const error = {
        errorType: 'displayName',
        errorMsg: 'Last Name is Required ! ',
      };
      return Promise.reject(error);
    }

    if (!email || email === 0) {
      const error = {
        errorType: 'email',
        errorMsg: 'Required ! ',
      };
      return Promise.reject(error);
    }

    this.setState({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    console.log(SCREEN, TAG, 'finish... ');

    return Promise.resolve();
  }

  async _updateUserProfile() {
    const TAG = '_updateUserProfile: ';
    console.log(SCREEN, TAG, 'start... ');

    try {
      await this._validation();
    } catch (e) {
      // statements
      return Promise.reject(e);
    }

    this.setState({
      isLoaderVisible: true,
      error: null,
    });

    const currentUser = AUTH.currentUser;

    const {firstName, lastName, profilePic} = this.state;

    const UserRef = DATABASE.collection('Users').doc(currentUser.uid);

    try {
      await UserRef.update({
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'profile.profilePic': profilePic,
      });
    } catch (e) {
      // statements
      console.error(SCREEN, TAG, 'UserRef.update: error... ', e);
      return Promise.reject(e);
    }

    console.log(SCREEN, TAG, 'finish... ');

    ToastAndroid.show('Update Successful', ToastAndroid.LONG);

    this.setState({
      isLoaderVisible: false,
      isModified: false,
    });
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
  }

  render() {
    const {
      profilePic,
      firstName,
      lastName,
      email,
      isLoaderVisible,
      loaderMsg,
      isConfirmationVisible,
      confirmationInfo,
      error,
      statusBarColor,
      isModified,
    } = this.state;

    return (
      <Screen>
        <StatusBar
          backgroundColor={statusBarColor}
          barStyle="dark-content"
          animated={true}
        />

        <View style={{flex: 1, backgroundColor: 'white'}}>
          <ScrollView>
            <ImageBackground
              style={{
                width: '100%',
                height: undefined,
                aspectRatio: 1,
              }}
              resizeMode="cover"
              source={{
                uri: profilePic,
              }}>
              <Tile
                style={{
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  paddingBottom: 15,
                  paddingLeft: 15,
                  paddingRight: 15,
                }}>
                <Lightbox
                  style={{elevation: 3, padding: 5, backgroundColor: '#f2f2f2'}}
                  activeProps={{
                    style: {
                      flex: 1,
                      width: '100%',
                    },
                    resizeMode: 'contain',
                  }}
                  onOpen={() => {
                    this.setState({
                      statusBarColor: 'black',
                    });
                  }}
                  onClose={() => {
                    this.setState({
                      statusBarColor: Colors.Misty_Rose,
                    });
                  }}>
                  <Image
                    style={{backgroundColor: '#f2f2f2'}}
                    styleName="medium-square"
                    source={{
                      uri: profilePic,
                    }}
                  />
                </Lightbox>
                <View styleName="content">
                  <TouchableOpacity onPress={this._handleProfilePic}>
                    <Overlay styleName="image-overlay">
                      <Caption
                        style={{color: 'white', elevation: 3}}
                        styleName="h-center">
                        TAP HERE TO CHANGE PROFILE PIC
                      </Caption>
                    </Overlay>
                  </TouchableOpacity>
                </View>
              </Tile>
            </ImageBackground>

            <View styleName="md-gutter">
              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Display Name:</Caption>
                <View styleName="horizontal stretch">
                  <TextInput
                    style={{
                      flex: 1,
                      elevation: 3,
                      textAlign: 'center',
                      marginRight: 5,
                    }}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={this._handleFirstName}
                  />

                  <TextInput
                    style={{
                      flex: 1,
                      elevation: 3,
                      textAlign: 'center',
                      marginLeft: 5,
                    }}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={this._handleLasttName}
                  />
                </View>
                {error && error.errorType === 'displayName' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Contact Number:</Caption>
                <View styleName="horizontal stretch">
                  <TextInput
                    style={{flex: 1, elevation: 3, textAlign: 'center'}}
                    placeholder="Phone Number"
                    onChangeText={() => {}}
                  />
                </View>
                {error && error.errorType === 'price' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Email Address:</Caption>
                <View styleName="horizontal stretch">
                  <TextInput
                    style={{flex: 1, elevation: 3, textAlign: 'center'}}
                    placeholder="Email"
                    value={email}
                    onChangeText={() => {}}
                  />
                </View>
                {error && error.errorType === 'price' && (
                  <Caption style={{color: 'red'}}>{error.errorMsg}</Caption>
                )}
              </View>

              <View styleName="stretch sm-gutter-top md-gutter-bottom">
                <Caption>Permanent Address:</Caption>
                <View styleName="horizontal stretch">
                  <Button
                    style={{elevation: 3}}
                    styleName="full-width"
                    onPress={() => {}}>
                    <Icon name="address" />
                    <Text>Address</Text>
                  </Button>
                </View>
              </View>
            </View>
          </ScrollView>
          <View
            style={{elevation: 8}}
            styleName="stretch horizontal md-gutter-left md-gutter-right md-gutter-bottom">
            <Button
              styleName="full-width"
              style={{elevation: 3}}
              onPress={() => {
                if (isModified) {
                  this.setState({
                    isConfirmationVisible: true,
                    confirmationInfo: 'Leave Without Saving ?',
                  });
                } else {
                  this.props.navigation.goBack();
                }
              }}>
              <Icon name="clear-text" />
              <Text>Back</Text>
            </Button>

            <Button
              styleName={
                isModified ? 'full-width secondary' : 'full-width muted'
              }
              style={{elevation: 3}}
              disabled={!isModified}
              onPress={() => {
                this._updateUserProfile().catch(error => {
                  this.setState({
                    error,
                  });
                });
              }}>
              <Icon name="checkbox-on" />
              <Text>Update</Text>
            </Button>
          </View>
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
                  this.setState({
                    isConfirmationVisible: false,
                  });

                  this.props.navigation.goBack();
                }}>
                <Icon name="checkbox-on" />
                <Text>YES</Text>
              </Button>
            </View>
          </View>
        </Modal>

        <Modal
          style={{margin: 92}}
          isVisible={isLoaderVisible}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}>
          <View style={{backgroundColor: 'white', padding: 15}}>
            <View styleName="horizontal h-center v-center">
              <ActivityIndicator size="large" color={Colors.Dark} />
              <Caption styleName="md-gutter-left">LOADING</Caption>
            </View>
          </View>
        </Modal>
      </Screen>
    );
  }
}
