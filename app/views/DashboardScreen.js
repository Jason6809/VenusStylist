import React, {Component} from 'react';

import {Screen, View, Title} from '@shoutem/ui';

import Colors from '../constants/Colors';

export class DashboardScreen extends Component {
  render() {
    return (
      <Screen>
        <View
          styleName="flexible vertical v-center"
          style={{backgroundColor: Colors.Misty_Rose}}>
          <Title styleName="h-center">Welcome to Venus Stylist</Title>
        </View>
      </Screen>
    );
  }
}
