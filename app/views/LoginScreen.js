import React, {Component} from 'react';
import {StyleSheet, KeyboardAvoidingView, StatusBar, Alert} from 'react-native';

import {
  Screen,
  View,
  Title,
  Subtitle,
  Text,
  Tile,
  TextInput,
  Button,
} from '@shoutem/ui';

import {Footer} from '../components/Footer';

import firebase from 'react-native-firebase';

const SCREEN = 'LoginScreen: ';

export class LoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: null,
      password: null,
    };

    this._handleEmailInput = this._handleEmailInput.bind(this);
    this._handlePasswordInput = this._handlePasswordInput.bind(this);
    this._loginUser = this._loginUser.bind(this);
  }

  _handleEmailInput(email) {
    const TAG = 'handleEmailInput: ';
    console.log(SCREEN, TAG, 'email = ', email);

    this.setState({email});
  }

  _handlePasswordInput(password) {
    const TAG = 'handlePasswordInput: ';
    console.log(SCREEN, TAG, 'password = ', password);

    this.setState({password});
  }

  _loginUser() {
    const TAG = 'loginUser: ';
    console.log(SCREEN, TAG, 'start...');
    console.log(SCREEN, TAG, 'email = ', this.state.email);
    console.log(SCREEN, TAG, 'password = ', this.state.password);

    firebase
      .auth()
      .signInWithEmailAndPassword(this.state.email, this.state.password)
      .then(
        userCred => {
          this.setState({
            email: null,
            password: null,
          });

          console.log(SCREEN, TAG, 'success...');
          console.log(SCREEN, TAG, 'userCred = ', userCred.user);

          this.props.navigation.navigate('LoadingScreen');
        },
        error => {
          console.error(SCREEN, TAG, 'failed...');
          console.log(SCREEN, TAG, 'error = ', error);
        },
      );
  }

  render() {
    console.log(SCREEN, 'props = ', this.props);

    return (
      <Screen>
        <StatusBar
          backgroundColor="white"
          barStyle="dark-content"
          animated={true}
        />
        <View style={styles.titleView}>
          <Tile styleName="text-centric">
            <Title>PROJECT VENUS</Title>
            <Subtitle>Login</Subtitle>
          </Tile>
        </View>

        <KeyboardAvoidingView
          style={styles.loginFormView}
          behavior="padding"
          enabled>
          <View styleName="vertical v-start lg-gutter">
            <TextInput
              style={styles.emailTextInput}
              placeholder={'Email'}
              keyboardType="email-address"
              value={this.state.email}
              onChangeText={this._handleEmailInput}
            />
            <TextInput
              style={styles.emailTextInput}
              placeholder={'Password'}
              secureTextEntry
              value={this.state.password}
              onChangeText={this._handlePasswordInput}
            />
            <Button
              styleName="secondary md-gutter-bottom"
              onPress={() => {
                this._loginUser();
              }}>
              <Text>LOGIN</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>

        <Footer />
      </Screen>
    );
  }
}

const styles = StyleSheet.create({
  titleView: {
    flex: 1,
  },
  loginFormView: {
    flex: 2,
  },
  emailTextInput: {
    marginBottom: 15,
  },
  passwordTextInput: {
    marginBottom: 15,
  },
});
