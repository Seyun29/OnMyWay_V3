import React, {useEffect, useState} from 'react';
import {Pressable, Keyboard, View, FlatList} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import PlaceInputHeader from '../../components/headers/placeInputHeader';
import NoHistorySVG from '../../assets/images/noHistory.svg';
import {useRecoilState, useRecoilValue} from '../../state/atom';
import {navigationState} from '../../atoms/navigationState';

import {useNavigation} from '@react-navigation/native';
import {whichNavState} from '../../atoms/whichNavState';
import {getCurPosition} from '../../config/helpers/location';
import {getAddress} from '../../api/getAddress';
import {get, store} from '../../config/helpers/storage';
import {RECENT_KEY} from '../../config/consts/storage';
import Spinner from '../../components/spinner';
import PlaceQueryResult from '../../components/placeQueryResult';
import {recentPlaceDetail} from '../../config/types/place';
import Toast from 'react-native-toast-message';
import {useTranslation} from '../../hooks/useTranslation';

export default function PlaceInputScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [resultList, setResultList] = useState<any[]>([]);
  const [isResult, setIsResult] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [placeInputHeaderHeight, setPlaceInputHeaderHeight] =
    useState<number>(112);
  const [, setNav] = useRecoilState(navigationState);
  const whichNav = useRecoilValue(whichNavState);
  const navigation = useNavigation();
  const toastTopOffset = insets.top + placeInputHeaderHeight + 10;

  const handlePress = async (result: any) => {
    switch (whichNav) {
      case 'start':
        setNav(prev => {
          return {
            ...prev,
            start: {
              name: result?.placeName || result?.addressName,
              coordinate: result?.coordinate,
            },
          };
        });
        break;
      case 'end':
        setNav(prev => {
          return {
            ...prev,
            end: {
              name: result?.placeName || result?.addressName,
              coordinate: result?.coordinate,
            },
          };
        });
        break;
      case 'editWayPoint1':
        setNav(prev => {
          const newWayPoint = {
            name: result?.placeName || result?.addressName,
            coordinate: result?.coordinate,
          };
          return {
            ...prev,
            wayPoints:
              prev.wayPoints.length === 2
                ? [newWayPoint, prev.wayPoints[1]]
                : [newWayPoint],
          };
        });
        break;
      case 'editWayPoint2':
        setNav(prev => {
          return {
            ...prev,
            wayPoints: [
              prev.wayPoints[0],
              {
                name: result?.placeName || result?.addressName,
                coordinate: result?.coordinate,
              },
            ],
          };
        });
        break;
      case 'newWayPoint':
        setNav(prev => {
          return {
            ...prev,
            wayPoints: [
              ...prev.wayPoints,
              {
                name: result?.placeName || result?.addressName,
                coordinate: result?.coordinate,
              },
            ],
          };
        });
        break;
    }
    //store to RECENT
    const prev = await get(RECENT_KEY);
    const newPlaces: recentPlaceDetail[] = [];
    prev?.places.forEach(place => {
      //push if the address is not already in the list
      if (place.addressName !== result?.addressName) {
        newPlaces.push(place);
      }
    });
    newPlaces.push({
      placeName: result?.placeName,
      addressName: result?.addressName,
      roadAddressName: result?.roadAddressName,
      coordinate: result?.coordinate,
    });
    await store(RECENT_KEY, {
      places: newPlaces.reverse(),
    });

    navigation.goBack();
  };

  const onCurPosPress = async () => {
    try {
      const curPos = await getCurPosition(false, toastTopOffset);
      // 서버 응답 실패 시 res가 undefined일 수 있다.
      const res = await getAddress(curPos);
      if (res === null) return;
      handlePress({
        addressName: res?.address ?? t('place.current'),
        roadAddressName: res?.road_address,
        coordinate: curPos,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('location.failed'),
        text2: t('location.checkPermission'),
        position: 'top',
        topOffset: toastTopOffset,
        visibilityTime: 2500,
        text1Style: {
          fontSize: 13,
          fontWeight: '600',
        },
        text2Style: {
          fontSize: 11,
          fontWeight: '400',
        },
      });
    }
  };

  const onMount = async () => {
    const history = await get(RECENT_KEY);
    if (history) {
      setIsResult(true);
      setResultList(history.places);
    }
  };

  useEffect(() => {
    onMount();
  }, []);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <PlaceInputHeader
        setResultList={setResultList}
        setIsResult={setIsResult}
        onCurPosPress={onCurPosPress}
        setLoading={setLoading}
        onHeightChange={setPlaceInputHeaderHeight}
      />
      <Pressable
        style={{flex: 1}}
        onPress={() => {
          Keyboard.dismiss();
        }}>
        {loading ? (
          <Spinner />
        ) : isResult && resultList.length > 0 ? (
          <FlatList
            style={{flex: 1, width: '100%'}}
            data={resultList}
            keyboardShouldPersistTaps="handled"
            renderItem={({item: result}) => (
              <PlaceQueryResult
                placeName={result.placeName}
                roadAddressName={result.roadAddressName}
                addressName={result.addressName}
                coordinate={result.coordinate}
                onPress={() => {
                  handlePress(result);
                }}
              />
            )}
            keyExtractor={(item, index) =>
              `${item.placeName ?? item.addressName ?? 'place'}-${index}`
            }
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <NoHistorySVG height={130} width={130} />
          </View>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
