import React, {useEffect, useState} from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParam} from '../../navigations';
import SelectOnMapHeader from '../../components/headers/selectOnMapHeader';
import SelectMap from '../../components/maps/selectMap';
import {Center, Coordinate} from '../../config/types/coordinate';
import {useRecoilState, useRecoilValue} from '../../state/atom';
import {lastCenterState} from '../../atoms/lastCenterState';
import {mapCenterState} from '../../atoms/mapCenterState';
import {MAIN_RED_LIGHT} from '../../config/consts/style';
import {DEFAULT_ZOOM} from '../../config/consts/map';
import {getCurPosition} from '../../config/helpers/location';
import Spinner from '../../components/spinner';
import {getAddress} from '../../api/getAddress';
import {navigationState} from '../../atoms/navigationState';
import {whichNavState} from '../../atoms/whichNavState';
import {RECENT_KEY} from '../../config/consts/storage';
import {get, store} from '../../config/helpers/storage';
import {useTranslation} from '../../hooks/useTranslation';

export const SelectMapScreen = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParam>>();
  const [, setNav] = useRecoilState(navigationState);
  const whichNav = useRecoilValue(whichNavState);
  const [lastCenter, setLastCenter] =
    useRecoilState<Center | null>(lastCenterState);
  const [mapCenter, setMapCenter] =
    useRecoilState<Center | null>(mapCenterState);
  const initialCenter = lastCenter ?? mapCenter;
  const [center, setCenter] = useState<Center | null>(initialCenter);
  const [coord, setCoord] = useState<Coordinate | null>(initialCenter);
  const [isCenterLoading, setIsCenterLoading] = useState(
    initialCenter === null,
  );

  const [addressText, setAddressText] = useState<string>('');
  const [roadAddressText, setRoadAddressText] = useState<string>('');

  const resolveCenter = async (initial: boolean) => {
    setIsCenterLoading(true);
    try {
      const currentPosition = await getCurPosition(initial);
      const nextCenter = {...currentPosition, zoom: DEFAULT_ZOOM};
      setCenter(nextCenter);
      setCoord(currentPosition);
      setMapCenter(nextCenter);
      setLastCenter(nextCenter);
    } catch {
      setCenter(null);
      setCoord(null);
    } finally {
      setIsCenterLoading(false);
    }
  };

  const setAddress = async (coordinate: Coordinate) => {
    // 서버 응답 실패 시 res가 undefined일 수 있다.
    const res = await getAddress(coordinate);
    if (res === null) return;
    setRoadAddressText(res?.road_address ?? '');
    setAddressText(res?.address ?? '');
  };

  const onSelect = async () => {
    if (!coord) return;

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
        return;
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
    if (!center) resolveCenter(true);
  }, []);

  useEffect(() => {
    if (coord) setAddress(coord);
  }, [coord]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <View className="flex-1">
        <SelectOnMapHeader />
        <View className="flex-1">
          {isCenterLoading ? (
            <Spinner />
          ) : center ? (
            <SelectMap lastCenter={center} setCoord={setCoord} />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="mb-4 text-center text-base text-slate-600">
                {t('location.failed')}
              </Text>
              <TouchableOpacity
                className="rounded-lg bg-slate-800 px-5 py-3"
                onPress={() => resolveCenter(false)}>
                <Text className="font-semibold text-white">
                  {t('location.tryAgain')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {center && coord && (
          <View className="py-2 px-4">
            <Text className="text-xl pb-1">{addressText}</Text>
            <Text className="text-l pb-3">{roadAddressText}</Text>
            <TouchableOpacity
              className="self-center w-full flex-row justify-center align-center py-1 rounded-lg"
              style={{
                backgroundColor: '#' + MAIN_RED_LIGHT,
              }}
              onPress={onSelect}>
              <Text className="text-xl text-white font-semibold">
                {t('common.select')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
