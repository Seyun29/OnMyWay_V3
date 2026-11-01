import NaverMapView from 'react-native-nmap';
import React, {useRef, useEffect, useState} from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ANAM} from '../../dummy/coord'; //using dummy for initial data
import {useRecoilState, useRecoilValue} from 'recoil';
import {Center, Coordinate} from '../../config/types/coordinate';
import {getCurPosition} from '../../config/helpers/location';
import CurPosMarker from '../markers/CurPosMarker';
import CurPosButton from '../buttons/CurPosButton';
import {Navigation} from '../../config/types/navigation';
import {navigationState} from '../../atoms/navigationState';
import NavMarker from '../markers/NavMarker';
import {getRoutes} from '../../api/getRoutes';
import Spinner from '../spinner';
import {onSelectRouteState} from '../../atoms/onSelectRouteState';
import {Routes} from '../../config/types/routes';
import CandidatePaths, {
  DefaultPath,
  SelectedPath,
} from '../paths/candidatePaths';
import {headerRoughState} from '../../atoms/headerRoughState';
import {calculateIsInBoundary, getZoomLevel} from '../../config/helpers/route';
import SelectRouteItem from '../selectRouteItem';
import {
  ROUGH_HEADER_HEIGHT,
  SELECT_ROUTE_ITEM_WIDTH,
} from '../../config/consts/style';
import {mapCenterState} from '../../atoms/mapCenterState';
import {loadingState} from '../../atoms/loadingState';
import Toast from 'react-native-toast-message';
import {headerHeightState} from '../../atoms/headerHeightState';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// @ts-ignore
const getItemLayout = (data, index) => ({
  length: SELECT_ROUTE_ITEM_WIDTH,
  offset: SELECT_ROUTE_ITEM_WIDTH * index,
  index: index,
});

export default function SelectRouteMap({
  setSelectedRoute,
}: {
  setSelectedRoute: any;
}) {
  const insets = useSafeAreaInsets();

  const [, setOnSelectRoute] = useRecoilState<boolean>(onSelectRouteState);
  const [, setIsRough] = useRecoilState<boolean>(headerRoughState);
  const [, setGlobalCenter] = useRecoilState<Center>(mapCenterState);
  const [isLoading, setLoading] = useRecoilState<boolean>(loadingState);
  const headerHeight = useRecoilValue<number>(headerHeightState);

  const [curPosition, setCurPosition] = useState<Coordinate | null>(null);
  const nav = useRecoilValue<Navigation>(navigationState);

  const prevNavRef = useRef<Navigation | null>(nav);
  const isFirstMount = useRef<boolean>(true);
  const flatListRef = useRef<FlatList>(null);

  const [routes, setRoutes] = useState<Routes>([]);
  const [curRouteIdx, setCurRouteIdx] = useState<number>(0);
  const [zoomTrigger, setZoomTrigger] = useState<boolean>(false);
  const [center, setCenter] = useState<Center>({...ANAM, zoom: 14});
  const [coveringRegion, setCoveringRegion] = useState<Coordinate[]>([]);
  const [zoom, setZoom] = useState<number>(14);
  const [toastTrigger, setToastTrigger] = useState<boolean>(false);
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);

  const onSelect = () => {
    Toast.hide();
    setOnSelectRoute(false);
    setSelectedRoute({
      ...routes[curRouteIdx],
      avoidTolls: avoidTolls,
    });
    setGlobalCenter(center);
    setTimeout(() => {
      Toast.show({
        type: 'info',
        text1: '카테고리나 키워드로 원하는 장소를 검색해보세요!',
        position: 'top',
        topOffset: headerHeight + insets.top + 50,
        visibilityTime: 1500,
        text1Style: {
          fontSize: 13,
          fontWeight: '600',
        },
      });
    }, 500);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = e.nativeEvent.contentOffset.x;
    const curIdx = Math.round(scrollPosition / SELECT_ROUTE_ITEM_WIDTH);
    setCurRouteIdx(curIdx);
  };

  const setCurPos = async () => {
    try {
      const curPos = await getCurPosition(false, headerHeight + insets.top);
      setCurPosition(curPos);
      setCenter({...curPos, zoom: 13}); //Cheat Shortcut for fixing centering bug
      setCenter({...curPos, zoom: zoom});
    } catch (error) {
      setCurPosition(null);
      Toast.show({
        type: 'error',
        text1: '현재 위치를 가져오는데 실패했습니다.',
        text2: '설정에서 위치 권한을 확인해주세요.',
        position: 'top',
        topOffset: headerHeight + insets.top,
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

  const setPath = async (
    sLat: number,
    sLon: number,
    eLat: number,
    eLon: number,
    avoid?: string,
  ) => {
    setLoading(true);
    const data = await getRoutes(nav, avoid);
    const initialZoom = getZoomLevel(data[0]?.distance);
    setRoutes(data);
    if (nav.wayPoints.length === 0)
      setCenter({
        latitude: (sLat + eLat) / 2,
        longitude: (sLon + eLon) / 2,
        zoom: initialZoom, //FIXME: adjust zoom level properly here!!!!!, start from 12, decrement by 0.5
      });
    else {
      const avgLat =
        (nav.wayPoints.reduce((acc, cur) => acc + cur.coordinate.latitude, 0) +
          sLat +
          eLat) /
        (nav.wayPoints.length + 2);
      const avgLon =
        (nav.wayPoints.reduce((acc, cur) => acc + cur.coordinate.longitude, 0) +
          sLon +
          eLon) /
        (nav.wayPoints.length + 2);
      setCenter({
        latitude: avgLat,
        longitude: avgLon,
        zoom: initialZoom,
      });
    }

    setZoomTrigger(true);
    setLoading(false);
  };

  const sortRoutes = (routeList: Routes) => {
    //shift the current route to the first index of the list
    if (routeList.length === 0) return [];
    const sortedRoutes = routeList.slice();
    const curRoute = sortedRoutes[curRouteIdx];
    sortedRoutes.splice(curRouteIdx, 1);
    sortedRoutes.unshift(curRoute);
    return sortedRoutes;
  };

  const showToast = () => {
    Toast.show({
      type: 'info',
      text1: '이동 경로를 선택해주세요',
      visibilityTime: 2000,
      topOffset: headerHeight + insets.top,
      text1Style: {
        fontSize: 13,
        fontWeight: '600',
      },
    });
  };

  const onUseEffectNav = async () => {
    if (nav.start && nav.end) {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        setIsRough(true);
        await setPath(
          nav.start.coordinate.latitude,
          nav.start.coordinate.longitude,
          nav.end.coordinate.latitude,
          nav.end.coordinate.longitude,
        );
        setToastTrigger(true);
        return;
      } else if (JSON.stringify(nav) !== JSON.stringify(prevNavRef.current)) {
        //바뀔때마다 getRoutes 호출
        setIsRough(true);
        await setPath(
          nav.start.coordinate.latitude,
          nav.start.coordinate.longitude,
          nav.end.coordinate.latitude,
          nav.end.coordinate.longitude,
          avoidTolls ? 'toll' : undefined,
        );
        setToastTrigger(true);
      }
    } else setOnSelectRoute(false);

    prevNavRef.current = nav;
  };

  useEffect(() => {
    onUseEffectNav();
  }, [nav]);

  useEffect(() => {
    if (routes.length > 0 && zoomTrigger) {
      //adjust Zoom size here according to nav range (start, waypoints, end), so that the whole route is visible
      //FIXME: Seperate cases in more detail!!
      const isInBoundary = calculateIsInBoundary(nav, coveringRegion);
      if (!isInBoundary) {
        setCenter({
          ...center,
          zoom: center.zoom - 0.3,
        });
      } else {
        setZoomTrigger(false);
        setTimeout(() => {
          setCenter({
            ...center,
            zoom: center.zoom - 0.3,
          });
        }, 100);
      }
    }
  }, [coveringRegion]);

  useEffect(() => {
    if (flatListRef.current && routes.length > 0) {
      flatListRef.current.scrollToIndex({
        index: curRouteIdx,
        animated: true,
      });
      sortRoutes(routes);
    }
  }, [curRouteIdx]);

  useEffect(() => {
    if (toastTrigger) {
      showToast();
      setToastTrigger(false);
    }
  }, [toastTrigger]);

  return (
    <View className="relative w-full h-full">
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <View
            style={{
              height: ROUGH_HEADER_HEIGHT,
            }}
          />
          <NaverMapView
            style={{
              width: '100%',
              // height: '100%',
              flex: 1,
            }}
            zoomControl={false}
            center={center}
            scaleBar
            mapType={0} //0 : Basic, 1 : Navi, 4 : Terrain, etc..
            onTouch={() => {
              setIsRough(true);
            }}
            onCameraChange={e => {
              setCoveringRegion(e.coveringRegion);
              setZoom(e.zoom);
            }}>
            {curPosition && <CurPosMarker curPosition={curPosition} />}
            <NavMarker />
            <CandidatePaths routes={sortRoutes(routes)} />
          </NaverMapView>
          <TouchableOpacity
            className="absolute left-4 bottom-[117px] flex-row px-2.5 py-2 justify-center items-center rounded-xl"
            style={{
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              backgroundColor: avoidTolls ? '#20C933' : '#fff',
            }}
            onPress={async () => {
              if (nav.start && nav.end) {
                setIsRough(true);
                await setPath(
                  nav.start.coordinate.latitude,
                  nav.start.coordinate.longitude,
                  nav.end.coordinate.latitude,
                  nav.end.coordinate.longitude,
                  !avoidTolls ? 'toll' : undefined,
                );
                setToastTrigger(true);
              }
              setAvoidTolls(!avoidTolls);
            }}>
            <Text
              className="text-xs"
              style={{
                color: avoidTolls ? '#FFFFFF' : '#A8A8A8',
              }}>
              무료도로
            </Text>
          </TouchableOpacity>
          <CurPosButton
            onPress={setCurPos}
            style="absolute right-4 bottom-[110px]"
          />
          <View className="absolute w-full bottom-4 bg-transparent">
            <FlatList
              ref={flatListRef}
              className="w-full overflow-hidden"
              horizontal
              data={routes}
              bounces={false}
              overScrollMode="never"
              showsHorizontalScrollIndicator={false}
              scrollToOverflowEnabled={false}
              keyExtractor={(item, index) => index.toString()}
              getItemLayout={getItemLayout}
              onScroll={handleScroll}
              renderItem={({item, index}) => (
                <SelectRouteItem item={item} onSelect={onSelect} />
              )}
            />
          </View>
        </>
      )}
    </View>
  );
}
