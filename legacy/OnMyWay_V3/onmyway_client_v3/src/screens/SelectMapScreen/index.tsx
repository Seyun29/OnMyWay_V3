import React, {useEffect, useState} from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParam} from '../../navigations';
import SelectOnMapHeader from '../../components/headers/selectOnMapHeader';
import SelectMap from '../../components/maps/selectMap';
import {Center, Coordinate} from '../../config/types/coordinate';
import {useRecoilState, useRecoilValue} from 'recoil';
import {lastCenterState} from '../../atoms/lastCenterState';
import {MAIN_RED_LIGHT} from '../../config/consts/style';
import {getAddress} from '../../api/getAddress';
import {navigationState} from '../../atoms/navigationState';
import {whichNavState} from '../../atoms/whichNavState';
import {RECENT_KEY} from '../../config/consts/storage';
import {get, store} from '../../config/helpers/storage';

export const SelectMapScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParam>>();
  const [, setNav] = useRecoilState(navigationState);
  const whichNav = useRecoilValue(whichNavState);
  const lastCenter = useRecoilValue<Center>(lastCenterState);
  const [coord, setCoord] = useState<Coordinate>(lastCenter);

  const [addressText, setAddressText] = useState<string>('');
  const [roadAddressText, setRoadAddressText] = useState<string>('');

  const setAddress = async (coord: Coordinate) => {
    const res = await getAddress(coord);
    setRoadAddressText(res.road_address ? res.road_address : '');
    setAddressText(res.address);
  };

  const onSelect = async () => {
    //FIXME: move this funtion to outside as a hook, reuse it in other components
    const newState = {
      name: addressText,
      coordinate: coord,
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
          addressName: newState.name,
          coordinate: newState.coordinate,
        },
        ...(prev?.places || []),
      ],
    });
    navigation.navigate('Home');
  };

  useEffect(() => {
    setAddress(coord);
  }, [coord]);

  return (
    <SafeAreaView className="flex-1 bg-white w-full h-full">
      <View className="flex-1">
        <SelectOnMapHeader />
        <View className="flex-1">
          <SelectMap lastCenter={lastCenter} setCoord={setCoord} />
        </View>
        <View
          className="py-2 px-4"
          //FIXME: fix styles (draft for now)
        >
          <Text className="text-xl pb-1">{addressText}</Text>
          <Text className="text-l pb-3">{roadAddressText}</Text>
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
