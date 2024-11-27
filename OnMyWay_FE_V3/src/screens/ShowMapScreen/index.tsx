import React from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParam} from '../../navigations';
import {useRecoilState, useRecoilValue} from 'recoil';
import {MAIN_RED_LIGHT} from '../../config/consts/style';
import {navigationState} from '../../atoms/navigationState';
import {whichNavState} from '../../atoms/whichNavState';
import {RECENT_KEY} from '../../config/consts/storage';
import {get, store} from '../../config/helpers/storage';
import ShowMapHeader from '../../components/headers/ShowMapHeader';
import ShowMap from '../../components/maps/showMap';

export const ShowMapScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParam>>();
  //get params from navigation
  const route = useRoute<RouteProp<RootStackParam, 'ShowMap'>>();
  const {coordinate, addressName, placeName, roadAddressName} = route.params;
  const [, setNav] = useRecoilState(navigationState);
  const whichNav = useRecoilValue(whichNavState);

  const onSelect = async () => {
    //FIXME: move this funtion to outside as a hook, reuse it in other components
    const newState = {
      name: placeName || addressName,
      coordinate,
    };
    switch (whichNav) {
      case 'start':
        setNav(prev => ({
          ...prev,
          start: newState,
        }));
        break;
      case 'end':
        setNav(prev => ({
          ...prev,
          end: newState,
        }));
        break;
      case 'editWayPoint1':
        setNav(prev => {
          return {
            ...prev,
            wayPoints:
              prev.wayPoints.length === 2
                ? [newState, prev.wayPoints[1]]
                : [newState],
          };
        });
        break;
      case 'editWayPoint2':
        setNav(prev => ({
          ...prev,
          wayPoints: [prev.wayPoints[0], newState],
        }));
        break;
      case 'newWayPoint':
        setNav(prev => ({
          ...prev,
          wayPoints: [...prev.wayPoints, newState],
        }));
        break;
      default:
        console.log('error while selecting place on map');
    }
    const prev = await get(RECENT_KEY);
    await store(RECENT_KEY, {
      places: [
        {
          placeName,
          roadAddressName,
          addressName,
          coordinate,
        },
        ...(prev?.places || []),
      ],
    });
    navigation.navigate('Home');
  };
  return (
    <SafeAreaView className="flex-1 bg-white w-full h-full">
      <View className="flex-1">
        <ShowMapHeader />
        <View className="flex-1">
          <ShowMap coordinate={coordinate} />
        </View>
        <View className="py-2 px-4">
          <Text className="text-xl pb-1">{placeName || addressName}</Text>
          <Text className="text-l pb-3">{roadAddressName}</Text>
          <TouchableOpacity
            className="self-center w-full flex-row justify-center align-center py-1 rounded-lg"
            style={{
              backgroundColor: '#' + MAIN_RED_LIGHT,
            }}
            onPress={onSelect}>
            <Text className="text-xl text-white font-semibold">선택</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
