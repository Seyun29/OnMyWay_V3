import OmwMapView from './omwMapView';
import React, {useRef, useEffect, useState} from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useRecoilState, useRecoilValue} from '../../state/atom';
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
import {RouteDetail, Routes} from '../../config/types/routes';
import CandidatePaths from '../paths/candidatePaths';
import {headerRoughState} from '../../atoms/headerRoughState';
import {calculateIsInBoundary, getZoomLevel} from '../../config/helpers/route';
import SelectRouteItem from '../selectRouteItem';
import SelectRouteEmptyItem from '../selectRouteEmptyItem';
import {TranslationKey} from '../../config/language';
import {
  ROUGH_HEADER_HEIGHT,
  SELECT_ROUTE_ITEM_WIDTH,
} from '../../config/consts/style';
import {mapCenterState} from '../../atoms/mapCenterState';
import {loadingState} from '../../atoms/loadingState';
import Toast from 'react-native-toast-message';
import {headerHeightState} from '../../atoms/headerHeightState';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from '../../hooks/useTranslation';
import {DEFAULT_ZOOM} from '../../config/consts/map';

const getNavigationCenter = (nav: Navigation): Center | null => {
  if (!nav.start || !nav.end) return null;

  const coordinates = [
    nav.start.coordinate,
    ...nav.wayPoints.map(wayPoint => wayPoint.coordinate),
    nav.end.coordinate,
  ];
  const total = coordinates.reduce(
    (sum, coordinate) => ({
      latitude: sum.latitude + coordinate.latitude,
      longitude: sum.longitude + coordinate.longitude,
    }),
    {latitude: 0, longitude: 0},
  );

  return {
    latitude: total.latitude / coordinates.length,
    longitude: total.longitude / coordinates.length,
    zoom: DEFAULT_ZOOM,
  };
};

const getItemLayout = (
  _data: ArrayLike<RouteDetail> | null | undefined,
  index: number,
) => ({
  length: SELECT_ROUTE_ITEM_WIDTH,
  offset: SELECT_ROUTE_ITEM_WIDTH * index,
  index,
});

export default function SelectRouteMap({
  setSelectedRoute,
}: {
  setSelectedRoute: any;
}) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const [, setOnSelectRoute] = useRecoilState<boolean>(onSelectRouteState);
  const [, setIsRough] = useRecoilState<boolean>(headerRoughState);
  const [, setGlobalCenter] = useRecoilState<Center | null>(mapCenterState);
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
  const [center, setCenter] = useState<Center | null>(() =>
    getNavigationCenter(nav),
  );
  const [coveringRegion, setCoveringRegion] = useState<Coordinate[]>([]);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [toastTrigger, setToastTrigger] = useState<boolean>(false);
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [routeErrorKey, setRouteErrorKey] = useState<TranslationKey | null>(
    null,
  );

  const onSelect = () => {
    const selectedRoute = routes[curRouteIdx];
    if (!selectedRoute || !center) {
      Toast.show({
        type: 'error',
        text1: t('route.noRoute'),
        position: 'top',
        topOffset: headerHeight + insets.top,
      });
      return;
    }
    Toast.hide();
    setOnSelectRoute(false);
    setSelectedRoute({
      ...selectedRoute,
      avoidTolls,
    });
    setGlobalCenter(center);
    setTimeout(() => {
      Toast.show({
        type: 'info',
        text1: t('search.afterRoute'),
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
        text1: t('location.failed'),
        text2: t('location.checkPermission'),
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

  const clearRouteState = () => {
    setRoutes([]);
    setCurRouteIdx(0);
    setZoomTrigger(false);
  };

  const setPath = async (
    sLat: number,
    sLon: number,
    eLat: number,
    eLon: number,
    avoid?: 'toll' | 'motorway',
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const data = await getRoutes(nav, avoid);
      if (data === null) {
        clearRouteState();
        return false;
      }
      if (data.length === 0) {
        clearRouteState();
        setRouteErrorKey('route.noRoute');
        return false;
      }

      const initialZoom = getZoomLevel(data[0].distance);
      setRouteErrorKey(null);
      setRoutes(data);
      setCurRouteIdx(0);
      if (nav.wayPoints.length === 0)
        setCenter({
          latitude: (sLat + eLat) / 2,
          longitude: (sLon + eLon) / 2,
          zoom: initialZoom,
        });
      else {
        const avgLat =
          (nav.wayPoints.reduce(
            (acc, cur) => acc + cur.coordinate.latitude,
            0,
          ) +
            sLat +
            eLat) /
          (nav.wayPoints.length + 2);
        const avgLon =
          (nav.wayPoints.reduce(
            (acc, cur) => acc + cur.coordinate.longitude,
            0,
          ) +
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
      return true;
    } catch (_error) {
      clearRouteState();
      setRouteErrorKey('route.loadFailed');
      return false;
    } finally {
      setLoading(false);
    }
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
      text1: t('route.selectPrompt'),
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
        const routeLoaded = await setPath(
          nav.start.coordinate.latitude,
          nav.start.coordinate.longitude,
          nav.end.coordinate.latitude,
          nav.end.coordinate.longitude,
        );
        if (routeLoaded) setToastTrigger(true);
        return;
      } else if (JSON.stringify(nav) !== JSON.stringify(prevNavRef.current)) {
        //바뀔때마다 getRoutes 호출
        setIsRough(true);
        const routeLoaded = await setPath(
          nav.start.coordinate.latitude,
          nav.start.coordinate.longitude,
          nav.end.coordinate.latitude,
          nav.end.coordinate.longitude,
          avoidTolls ? 'toll' : undefined,
        );
        if (routeLoaded) setToastTrigger(true);
      }
    } else setOnSelectRoute(false);

    prevNavRef.current = nav;
  };

  useEffect(() => {
    onUseEffectNav();
  }, [nav]);

  useEffect(() => {
    if (routes.length > 0 && zoomTrigger && center) {
      const isInBoundary = calculateIsInBoundary(nav, coveringRegion);
      if (!isInBoundary) {
        setCenter(currentCenter =>
          currentCenter
            ? {...currentCenter, zoom: currentCenter.zoom - 0.3}
            : null,
        );
      } else {
        setZoomTrigger(false);
        setTimeout(() => {
          setCenter(currentCenter =>
            currentCenter
              ? {...currentCenter, zoom: currentCenter.zoom - 0.3}
              : null,
          );
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
      {isLoading || !center ? (
        <Spinner />
      ) : (
        <>
          <View
            style={{
              height: ROUGH_HEADER_HEIGHT,
            }}
          />
          <OmwMapView
            style={{
              width: '100%',
              // height: '100%',
              flex: 1,
            }}
            zoomControl={false}
            center={center}
            scaleBar
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
          </OmwMapView>
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
                const routeLoaded = await setPath(
                  nav.start.coordinate.latitude,
                  nav.start.coordinate.longitude,
                  nav.end.coordinate.latitude,
                  nav.end.coordinate.longitude,
                  !avoidTolls ? 'toll' : undefined,
                );
                if (routeLoaded) setToastTrigger(true);
              }
              setAvoidTolls(!avoidTolls);
            }}>
            <Text
              className="text-xs"
              style={{
                color: avoidTolls ? '#FFFFFF' : '#A8A8A8',
              }}>
              {t('route.tollFree')}
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
              renderItem={({item}) => (
                <SelectRouteItem item={item} onSelect={onSelect} />
              )}
              ListEmptyComponent={
                routeErrorKey ? (
                  <SelectRouteEmptyItem messageKey={routeErrorKey} />
                ) : null
              }
            />
          </View>
        </>
      )}
    </View>
  );
}
