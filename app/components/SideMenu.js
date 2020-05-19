import React, {Component} from 'react';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  Caption,
  Tile,
  Button,
  Icon,
  Row,
  TouchableOpacity,
  Card,
  Image,
  ImageBackground,
  Divider,
} from '@shoutem/ui';

import firebase from 'react-native-firebase';
const AUTH = firebase.auth();
const DATABASE = firebase.firestore();
const MESSAGING = firebase.messaging();
const NOTIFICATIONS = firebase.notifications();

const COMPONENT = 'SideMenu: ';

export class SideMenu extends Component {
  constructor(props) {
    super(props);
    console.log(COMPONENT, 'props', props);

    this.onUserProfileSnapshot = null;

    this.state = {
      userProfile: null,
    };

    this._logout = this._logout.bind(this);
  }

  componentDidMount() {
    this._getUserProfile();
  }

  _logout() {
    const TAG = 'logout: ';

    const currentUser = AUTH.currentUser;

    const fcmToken = null;

    DATABASE.collection('UserStatus')
      .doc(currentUser.uid)
      .update({
        fcmToken,
      })
      .then(() => {
        AUTH.signOut().then(() => {
          console.log(COMPONENT, TAG, 'success...');

          this.props.navigation.navigate('LoadingScreen');
        });
      });
  }

  _getUserProfile() {
    const TAG = 'getUserProfile: ';

    const currentUser = AUTH.currentUser;

    this.onUserProfileSnapshot = DATABASE.collection('Users')
      .doc(currentUser.uid)
      .onSnapshot(doc => {
        if (doc.exists) {
          console.log(COMPONENT + TAG + 'doc = ', doc.data());
          this.setState({userProfile: doc.data()});
        } else {
          console.error(COMPONENT + TAG + 'Doc is not exist...');
        }
      });
  }

  componentWillUnmount() {
    const TAG = 'onUserProfileSnapshot: ';
    console.log(COMPONENT, TAG, 'start...');

    if (this.onBookingRequestSnapshot) {
      console.log(
        COMPONENT,
        TAG,
        'onUserProfileSnapshot = ',
        this.onUserProfileSnapshot,
      );

      this.onUserProfileSnapshot();
    }
  }

  render() {
    const userProfile = this.state.userProfile;

    return (
      <View styleName="flexible">
        <ImageBackground
          style={{
            width: '100%',
            height: undefined,
            aspectRatio: 1.5,
          }}
          resizeMode="cover"
          source={{
            uri: userProfile ? userProfile.profile.profilePic : '',
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
            <View styleName="stretch">
              <Row style={{elevation: 3}}>
                <Image
                  style={{backgroundColor: '#f2f2f2'}}
                  styleName="small rounded-corners"
                  source={{
                    uri: userProfile ? userProfile.profile.profilePic : '',
                  }}
                />
                <View styleName="vertical stretch v-center">
                  <Subtitle>
                    {userProfile &&
                      `${userProfile.profile.firstName} ${
                        userProfile.profile.lastName
                      }`}
                  </Subtitle>
                  <View styleName="horizontal">
                    <Caption>{userProfile && `${userProfile.email}`}</Caption>
                  </View>
                </View>
              </Row>
            </View>
          </Tile>
        </ImageBackground>

        <View>
          <Button
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              paddingBottom: 15,
              paddingTop: 15,
            }}
            styleName="md-gutter"
            onPress={() => {
              this.props.navigation.navigate('ProfileScreen', {
                userProfile,
              });
            }}>
            <Icon name="user-profile" />
            <Text>Manage Profile</Text>
          </Button>
        </View>

        <View>
          <Button
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              paddingBottom: 15,
              paddingTop: 15,
            }}
            styleName="md-gutter"
            onPress={() => {
              this.props.navigation.navigate('ManageServicesScreen');
            }}>
            <Icon name="add-event" />
            <Text>Manage Services</Text>
          </Button>
        </View>

        <View>
          <Button
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              paddingBottom: 15,
              paddingTop: 15,
            }}
            styleName="md-gutter"
            onPress={() => {
              this.props.navigation.navigate('ManageMarketScreen');
            }}>
            <Icon name="cart" />
            <Text>Manage Market Inventory</Text>
          </Button>
        </View>

        <View>
          <Button
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              paddingBottom: 15,
              paddingTop: 15,
            }}
            styleName="md-gutter"
            onPress={() => {
              this.props.navigation.navigate('ManageRentalScreen');
            }}>
            <Icon name="products" />
            <Text>Manage Rental Inventory</Text>
          </Button>
        </View>

        <View styleName="flexible" />

        <View>
          <Divider styleName="line" />
          <Button
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              paddingBottom: 15,
              paddingTop: 15,
            }}
            styleName="md-gutter"
            onPress={() => {
              this._logout();
            }}>
            <Icon name="exit-to-app" />
            <Text>Sign Out</Text>
          </Button>
        </View>
      </View>
    );
  }
}
