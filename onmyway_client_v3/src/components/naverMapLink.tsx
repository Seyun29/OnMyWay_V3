import React, {useEffect} from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NaverLogo from '../assets/images/naverLogo.svg';
import {STORE_URL, TMAP_STORE_URL} from '../config/consts/link';
import {useRecoilValue} from 'recoil';
import {Navigation} from '../config/types/navigation';
import {navigationState} from '../atoms/navigationState';
import {PlaceDetail} from '../config/types/coordinate';
import {curPlaceState} from '../atoms/curPlaceState';
import {createURLScheme} from '../config/helpers/nmapLink';
import TMapLogo from '../assets/images/tMapLogo.svg';
import TMap from '../modules/TMap';
import {createTmapWaypoints} from '../config/helpers/tmapLink';

const NaverMapLink = ({
  stopByStrategy,
}: {
  stopByStrategy: 'FRONT' | 'MIDDLE' | 'REAR' | undefined;
}) => {
  const nav = useRecoilValue<Navigation>(navigationState);
  const curPlace = useRecoilValue<PlaceDetail | null>(curPlaceState);
  const [initialPressed, setInitialPressed] = React.useState<boolean>(false);

  const openNaverMap = () => {
    const url = createURLScheme(
      nav.start,
      nav.end,
      nav.wayPoints,
      curPlace,
      stopByStrategy,
    );
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          if (Platform.OS === 'ios')
            Alert.alert(
              '오류',
              '네이버맵이 설치되어있지 않습니다.\n앱스토어로 이동하시겠습니까?',
              [
                {text: '확인', onPress: () => Linking.openURL(STORE_URL)},
                {
                  text: '취소',
                  style: 'cancel',
                },
              ],
            );
          else
            Alert.alert(
              '오류',
              '네이버맵이 설치되어있지 않습니다.\n플레이스토어로 이동하시겠습니까?',
              [
                {text: '확인', onPress: () => Linking.openURL(STORE_URL)},
                {
                  text: '취소',
                  style: 'cancel',
                },
              ],
            );
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  const openTMap = () => {
    //FIXME: Android only for now
    //FIXME: 경유지, 출발지 넣는 기능 추가! -> 경유지의 경우, 해당하지 않으면 null로 세팅할것!!
    if (curPlace && nav.start && nav.end) {
      const tMapWaypoints = createTmapWaypoints(
        nav.wayPoints,
        curPlace,
        stopByStrategy,
      );
      TMap.openNavi(
        nav.end.name,
        nav.end.coordinate.longitude.toString(),
        nav.end.coordinate.latitude.toString(),
        tMapWaypoints.rV1Name,
        tMapWaypoints.rV1Longitude,
        tMapWaypoints.rV1Latitude,
        tMapWaypoints.rV2Name,
        tMapWaypoints.rV2Longitude,
        tMapWaypoints.rV2Latitude,
        tMapWaypoints.rV3Name,
        tMapWaypoints.rV3Longitude,
        tMapWaypoints.rV3Latitude,
      ).then(data => {
        if (!data) {
          Alert.alert(
            '오류',
            `티맵이 설치되어있지 않습니다.\n${
              Platform.OS === 'android' ? '플레이스토어' : '앱스토어'
            }로 이동하시겠습니까?`,
            [
              {
                text: '확인',
                onPress: () => Linking.openURL(TMAP_STORE_URL),
              },
              {
                text: '취소',
                style: 'cancel',
              },
            ],
          );
        }
      });
    } else {
      Alert.alert('알림', '일시적인 오류입니다. 다시 시도해주세요.');
    }
  };

  const onNaviPress = () => {
    if (!nav.start || !nav.end || !curPlace) {
      Alert.alert('오류', '일시적인 오류입니다. 다시 시도해주세요.');
      return;
    }
    Alert.alert(
      '알림',
      '길안내를 받으실 앱을 선택해주세요',
      [
        {text: '네이버맵', onPress: openNaverMap},
        {text: 'T맵', onPress: openTMap},
        //FIXME: comment out the following code after update-screening pass
        {
          text: 'Apple맵',
          onPress: () => {
            Linking.openURL(
              `http://maps.apple.com/?saddr=${curPlace.y},${curPlace.x}&daddr=${nav.start?.coordinate.latitude},${nav.start?.coordinate.longitude}&dirflg=d`,
            );
          },
        },
      ],
      {cancelable: true},
    );
  };

  useEffect(() => {
    if (initialPressed && curPlace) setInitialPressed(false);
  }, [curPlace]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [initialPressed]);

  if (Platform.OS === 'ios')
    return (
      <TouchableOpacity
        className="flex-row justify-center items-center rounded-full px-3.5 py-2.5 mb-1"
        onPress={openNaverMap}
        style={{
          backgroundColor: '#57B04B',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
        <NaverLogo width={15} height={15} />
        <Text className="ml-2 text-white text-xs">네이버맵 길안내 시작</Text>
      </TouchableOpacity>
    );

  return (
    <View className="pb-2">
      {initialPressed && (
        <TouchableOpacity
          className="flex-row justify-center items-center rounded-full"
          onPress={openNaverMap}
          style={{
            backgroundColor: '#57B04B',
            paddingVertical: 8.5,
            paddingHorizontal: 10,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
          <NaverLogo width={15} height={15} />
          <Text className="ml-2 text-white text-xs">네이버맵 길안내 시작</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        className="flex-row justify-center items-center rounded-full bg-[#ffffff] px-3.5 pl-2.5 py-[5px] mt-2"
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        onPress={() => {
          if (!initialPressed) setInitialPressed(true);
          else openTMap();
        }}>
        <TMapLogo width={22} height={22} />
        <Text className="ml-0.5 text-slate-700 text-xs">
          티맵으로 길안내 시작
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default NaverMapLink;
