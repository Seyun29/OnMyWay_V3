import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../screens/HomeScreen';
import {SelectMapScreen} from '../screens/SelectMapScreen';
import PlaceInputScreen from '../screens/PlaceInputScreen';
import {ShowMapScreen} from '../screens/ShowMapScreen';
import {Coordinate} from '../config/types/coordinate';

const Stack = createNativeStackNavigator();

export type RootStackParam = {
  Home: undefined;
  SelectMap: undefined;
  ShowMap: {
    coordinate: Coordinate;
    placeName?: string;
    roadAddressName?: string;
    addressName: string;
  };
  PlaceInput: undefined;
};

export default function RootStackNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SelectMap" component={SelectMapScreen} />
        <Stack.Screen name="ShowMap" component={ShowMapScreen} />
        <Stack.Screen
          name="PlaceInput"
          component={PlaceInputScreen}
          options={{animation: 'fade_from_bottom'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
