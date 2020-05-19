import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import createAnimatedSwitchNavigator from 'react-navigation-animated-switch';
import { createDrawerNavigator, DrawerActions } from 'react-navigation-drawer';
import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import { Transition } from 'react-native-reanimated';

import { Screen, View, Title, Subtitle, Icon, Button } from '@shoutem/ui';

import Colors from './app/constants/Colors';

import { SideMenu } from './app/components/SideMenu';

import { DashboardScreen } from './app/views/DashboardScreen';
import { ProfileScreen } from './app/views/ProfileScreen';
import { ManageServicesScreen } from './app/views/ManageServicesScreen';
import { ManageMarketScreen } from './app/views/ManageMarketScreen';
import { ManageRentalScreen } from './app/views/ManageRentalScreen';
import { BookingRequestScreen } from './app/views/BookingRequestScreen';
import { AppointmentScreen } from './app/views/AppointmentScreen';
import { BookingDetailScreen } from './app/views/BookingDetailScreen';
import { AppointmentHistoryScreen } from './app/views/AppointmentHistoryScreen';
import { PurchaseOrdersScreen } from './app/views/PurchaseOrdersScreen';
import { ShippingStatusScreen } from './app/views/ShippingStatusScreen';
import { PurchaseHistoryScreen } from './app/views/PurchaseHistoryScreen';
import { RentalRequestScreen } from './app/views/RentalRequestScreen';
import { RentalProgressScreen } from './app/views/RentalProgressScreen';
import { RentalDetailScreen } from './app/views/RentalDetailScreen';
import { RentalHistoryScreen } from './app/views/RentalHistoryScreen';
import { LoginScreen } from './app/views/LoginScreen';
import { LoadingScreen } from './app/views/LoadingScreen';

const SCREEN = 'App.js';

const DashBoardStack = createStackNavigator(
  {
    DashboardScreen: {
      screen: DashboardScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}>
            <Icon name="sidebar" />
            <Title>DASHBOARD</Title>
          </Button>
        ),
        headerStyle: {
          elevation: 0,
          backgroundColor: Colors.Misty_Rose,
        },
      }),
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      swipeEnabled:
        navigation.state.routes[navigation.state.index].routeName ===
        'DashboardScreen',
      tabBarVisible:
        navigation.state.routes[navigation.state.index].routeName ===
        'DashboardScreen',
    }),
  },
);

const BookingStackTabs = createMaterialTopTabNavigator(
  {
    BookingRequest: {
      screen: BookingRequestScreen,
      navigationOptions: {
        tabBarLabel: <Subtitle>REQUEST</Subtitle>,
      },
    },
    Appointment: {
      screen: AppointmentScreen,
      navigationOptions: {
        tabBarLabel: <Subtitle>APPOINTMENT</Subtitle>,
      },
    },
  },
  {
    swipeEnabled: false,
    tabBarOptions: {
      showIcon: false,
      showLabel: true,
      indicatorStyle: {
        backgroundColor: Colors.Dark,
      },
      style: {
        borderTopColor: 'transparent',
        borderTopWidth: 0,
        elevation: 8,
        backgroundColor: Colors.Misty_Rose,
      },
    },
  },
);

const BookingStack = createStackNavigator(
  {
    BookingScreen: {
      screen: BookingStackTabs,
      navigationOptions: ({ navigation }) => ({
        headerTitle: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}>
            <Icon name="sidebar" />
            <Title>BOOKING</Title>
          </Button>
        ),
        headerRight: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.navigate('AppointmentHistoryScreen');
            }}>
            <Icon name="history" />
          </Button>
        ),
        headerStyle: {
          elevation: 0,
          backgroundColor: Colors.Misty_Rose,
        },
      }),
    },
    BookingDetailScreen: {
      screen: BookingDetailScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>DETAILS</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
    AppointmentHistoryScreen: {
      screen: AppointmentHistoryScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>HISTORY</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      swipeEnabled:
        navigation.state.routes[navigation.state.index].routeName ===
        'BookingScreen',
      tabBarVisible:
        navigation.state.routes[navigation.state.index].routeName ===
        'BookingScreen',
    }),
  },
);

const MarketStackTabs = createMaterialTopTabNavigator(
  {
    PurchaseOrdersScreen: {
      screen: PurchaseOrdersScreen,
      navigationOptions: {
        tabBarLabel: <Subtitle>NEW ORDERS</Subtitle>,
      },
    },
    ShippingStatusScreen: {
      screen: ShippingStatusScreen,
      navigationOptions: {
        tabBarLabel: <Subtitle>IN SHIPPING</Subtitle>,
      },
    },
  },
  {
    swipeEnabled: false,
    tabBarOptions: {
      showIcon: false,
      showLabel: true,
      indicatorStyle: {
        backgroundColor: Colors.Dark,
      },
      style: {
        borderTopColor: 'transparent',
        borderTopWidth: 0,
        elevation: 8,
        backgroundColor: Colors.Misty_Rose,
      },
    },
  },
);

const MarketStack = createStackNavigator({
  MarketScreen: {
    screen: MarketStackTabs,
    navigationOptions: ({ navigation }) => ({
      headerTitle: (
        <Button
          styleName="clear"
          onPress={() => {
            navigation.dispatch(DrawerActions.toggleDrawer());
          }}>
          <Icon name="sidebar" />
          <Title>MARKET</Title>
        </Button>
      ),
      headerRight: (
        <Button
          styleName="clear"
          onPress={() => {
            navigation.navigate('PurchaseHistoryScreen');
          }}>
          <Icon name="history" />
        </Button>
      ),
      headerStyle: {
        elevation: 0,
        backgroundColor: Colors.Misty_Rose,
      },
    }),
  },
  PurchaseHistoryScreen: {
    screen: PurchaseHistoryScreen,
    navigationOptions: ({ navigation }) => ({
      headerTitle: <Title>HISTORY</Title>,
      headerLeft: (
        <Button
          styleName="clear"
          onPress={() => {
            navigation.goBack();
          }}>
          <Icon name="back" />
        </Button>
      ),
      headerStyle: {
        elevation: 3,
      },
    }),
  },
},
  {
    navigationOptions: ({ navigation }) => ({
      swipeEnabled:
        navigation.state.routes[navigation.state.index].routeName ===
        'MarketScreen',
      tabBarVisible:
        navigation.state.routes[navigation.state.index].routeName ===
        'MarketScreen',
    }),
  }
);

const RentalStackTabs = createMaterialTopTabNavigator(
  {
    RentalRequest: {
      screen: RentalRequestScreen,
      navigationOptions: {
        tabBarLabel: <Subtitle>REQUEST</Subtitle>,
      },
    },
    RentalProgress: {
      screen: RentalProgressScreen,
      navigationOptions: {
        tabBarLabel: <Subtitle>IN PROGRESS</Subtitle>,
      },
    },
  },
  {
    swipeEnabled: false,
    tabBarOptions: {
      showIcon: false,
      showLabel: true,
      indicatorStyle: {
        backgroundColor: Colors.Dark,
      },
      style: {
        borderTopColor: 'transparent',
        borderTopWidth: 0,
        elevation: 8,
        backgroundColor: Colors.Misty_Rose,
      },
    },
  },
);

const RentalStack = createStackNavigator(
  {
    RentalScreen: {
      screen: RentalStackTabs,
      navigationOptions: ({ navigation }) => ({
        headerTitle: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}>
            <Icon name="sidebar" />
            <Title>RENTAL</Title>
          </Button>
        ),
        headerRight: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.navigate('RentalHistoryScreen');
            }}>
            <Icon name="history" />
          </Button>
        ),
        headerStyle: {
          elevation: 0,
          backgroundColor: Colors.Misty_Rose,
        },
      }),
    },
    RentalDetailScreen: {
      screen: RentalDetailScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>DETAILS</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
    RentalHistoryScreen: {
      screen: RentalHistoryScreen,
      navigationOptions: ({ navigation }) => ({
        headerTitle: <Title>HISTORY</Title>,
        headerLeft: (
          <Button
            styleName="clear"
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="back" />
          </Button>
        ),
        headerStyle: {
          elevation: 3,
        },
      }),
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      swipeEnabled:
        navigation.state.routes[navigation.state.index].routeName ===
        'RentalScreen',
      tabBarVisible:
        navigation.state.routes[navigation.state.index].routeName ===
        'RentalScreen',
    }),
  },
);

const HomeStack = createMaterialTopTabNavigator(
  {
    DashBoard: {
      screen: DashBoardStack,
      navigationOptions: () => ({
        tabBarIcon: ({ focused }) => {
          return focused === true ? (
            <Icon name="home" style={styles.active} />
          ) : (
              <Icon name="home" />
            );
        },
      }),
    },
    Booking: {
      screen: BookingStack,
      navigationOptions: () => ({
        tabBarIcon: ({ focused }) => {
          return focused === true ? (
            <Icon name="add-event" style={styles.active} />
          ) : (
              <Icon name="add-event" />
            );
        },
      }),
    },
    Market: {
      screen: MarketStack,
      navigationOptions: () => ({
        tabBarIcon: ({ focused }) => {
          return focused === true ? (
            <Icon name="cart" style={styles.active} />
          ) : (
              <Icon name="cart" />
            );
        },
      }),
    },
    Rental: {
      screen: RentalStack,
      navigationOptions: () => ({
        tabBarIcon: ({ focused }) => {
          return focused === true ? (
            <Icon name="products" style={styles.active} />
          ) : (
              <Icon name="products" />
            );
        },
      }),
    },
  },
  {
    initialRouteName: 'DashBoard',
    swipeEnabled: true,
    tabBarPosition: 'bottom',
    tabBarOptions: {
      showIcon: true,
      showLabel: false,
      indicatorStyle: {
        backgroundColor: Colors.Pink,
      },
      style: {
        borderTopColor: 'transparent',
        borderTopWidth: 0,
        elevation: 8,
        backgroundColor: 'white',
      },
    },
  },
);

const DrawerStack = createStackNavigator({
  Home: {
    screen: HomeStack,
    navigationOptions: {
      headerShown: false,
    },
  },
  ProfileScreen: {
    screen: ProfileScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: (
        <Button
          style={{
            backgroundColor: Colors.Misty_Rose,
            borderColor: Colors.Misty_Rose,
            elevation: 3,
            padding: 10,
            marginLeft: 15,
          }}
          onPress={() => {
            navigation.goBack();
          }}>
          <Icon style={{ marginRight: 0 }} name="back" />
        </Button>
      ),
      headerTransparent: true,
      headerStyle: {
        backgroundColor: 'transparent',
        elevation: 0,
      },
    }),
  },
  ManageServicesScreen: {
    screen: ManageServicesScreen,
    navigationOptions: ({ navigation }) => ({
      headerTitle: <Title>MANAGE SERVICES</Title>,
      headerLeft: (
        <Button
          styleName="clear"
          onPress={() => {
            navigation.goBack();
          }}>
          <Icon name="back" />
        </Button>
      ),
      headerStyle: {
        elevation: 3,
      },
    }),
  },
  ManageMarketScreen: {
    screen: ManageMarketScreen,
    navigationOptions: ({ navigation }) => ({
      headerTitle: <Title>MANAGE MARKET</Title>,
      headerLeft: (
        <Button
          styleName="clear"
          onPress={() => {
            navigation.goBack();
          }}>
          <Icon name="back" />
        </Button>
      ),
      headerStyle: {
        elevation: 3,
      },
    }),
  },
  ManageRentalScreen: {
    screen: ManageRentalScreen,
    navigationOptions: ({ navigation }) => ({
      headerTitle: <Title>MANAGE RENTAL</Title>,
      headerLeft: (
        <Button
          styleName="clear"
          onPress={() => {
            navigation.goBack();
          }}>
          <Icon name="back" />
        </Button>
      ),
      headerStyle: {
        elevation: 3,
      },
    }),
  },
});

const AppStack = createDrawerNavigator(
  {
    Main: {
      screen: DrawerStack,
    },
  },
  {
    initialRouteName: 'Main',
    drawerWidth: 300,
    contentComponent: SideMenu,
  },
);

const AuthStack = createStackNavigator(
  {
    LoginScreen: {
      screen: LoginScreen,
    },
  },
  {
    headerMode: 'none',
  },
);

const AppContainer = createAppContainer(
  createAnimatedSwitchNavigator(
    {
      LoadingScreen: LoadingScreen,
      App: AppStack,
      Auth: AuthStack,
    },
    {
      initialRouteName: 'LoadingScreen',
      transition: (
        <Transition.Together>
          <Transition.Out
            type="slide-left"
            durationMs={200}
            interpolation="linear"
          />
          <Transition.In type="fade" durationMs={200} />
        </Transition.Together>
      ),
    },
  ),
);

export default class App extends Component {
  render() {
    return (
      <Screen>
        <AppContainer />
      </Screen>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  active: {
    color: Colors.Pink,
  },
});
