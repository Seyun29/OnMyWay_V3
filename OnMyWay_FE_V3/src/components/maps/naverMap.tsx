import OmwMapView from './omwMapView';
import React, {useRef, useEffect, useState} from 'react';
import {Keyboard, Platform, Text, TouchableOpacity, View} from 'react-native';
import {useRecoilState, useRecoilValue} from '../../state/atom';
import {modalState} from '../../atoms/modalState';
import {Center, Coordinate, PlaceDetail} from '../../config/types/coordinate';
import {mapCenterState} from '../../atoms/mapCenterState';
import {lastCenterState} from '../../atoms/lastCenterState';
import {getCurPosition} from '../../config/helpers/location';
import CurPosMarker from '../markers/CurPosMarker';
import CurPosButton from '../buttons/CurPosButton';
import {Navigation} from '../../config/types/navigation';
import {navigationState} from '../../atoms/navigationState';
import {DEFAULT_ZOOM, ENLARGE_ZOOM} from '../../config/consts/map';
import NavMarker from '../markers/NavMarker';
import {headerRoughState} from '../../atoms/headerRoughState';
import Spinner from '../spinner';
import {onSelectRouteState} from '../../atoms/onSelectRouteState';
import {getAddress} from '../../api/getAddress';
import {
  DefaultPath,
  OMWPath,
  SearchRadiusIndicator,
  SelectedPath,
} from '../paths/candidatePaths';
import {loadingState} from '../../atoms/loadingState';
import KeywordSearchBox from '../keywordSearchBox';
import {RouteDetail} from '../../config/types/routes';
import OmwMarker from '../markers/OmwMarker';
import {ROUGH_HEADER_HEIGHT} from '../../config/consts/style';
import Toast from 'react-native-toast-message';
import BackToListButton from '../backToListButton';
import NaverMapLink from '../naverMapLink';
import ListBottomSheet from '../bottomSheets/listBottomSheet';
import {listModalState} from '../../atoms/listModalState';
import {checkPermissions} from '../../hooks/usePermissions';
import {headerHeightState} from '../../atoms/headerHeightState';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PlaceSearchQuery} from '../../config/consts/query';
import {useTranslation} from '../../hooks/useTranslation';

export default function NaverMap({
  selectedRoute,
  stopByData,
}: {
  selectedRoute: RouteDetail | null;
  stopByData: any;
}) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useRecoilState<boolean>(modalState);
  const [listModalVisible, setListModalVisible] =
    useRecoilState<boolean>(listModalState);
  const [, setIsRough] = useRecoilState<boolean>(headerRoughState);
  const [lastCenter, setLastCenter] =
    useRecoilState<Center | null>(lastCenterState);
  const isLoading = useRecoilValue<boolean>(loadingState);
  const [nav, setNav] = useRecoilState<Navigation>(navigationState);

  const [center, setCenter] = useRecoilState<Center | null>(mapCenterState);
  const [, setOnSelectRoute] = useRecoilState<boolean>(onSelectRouteState);
  const headerHeight = useRecoilValue<number>(headerHeightState);

  const [curPosition, setCurPosition] = useState<Coordinate | null>(null);
  const [isCenterInitializing, setIsCenterInitializing] = useState(
    center === null,
  );

  //for filtering the result
  const [originalResult, setOriginalResult] = useState<PlaceDetail[] | null>(
    null,
  );
  const [result, setResult] = useState<PlaceDetail[] | null>(null);

  const [query, setQuery] = useState<PlaceSearchQuery>({
    kind: 'keyword',
    value: '',
  });
  const [showAlternative, setShowAlternative] = useState<boolean>(false);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(1);

  const prevNavRef = useRef<Navigation | null>(nav);
  const isFirstMount = useRef<boolean>(true);

  const setCurPos = async (initial?: boolean) => {
    if (!center) setIsCenterInitializing(true);

    try {
      const curPos = await getCurPosition(initial, headerHeight + insets.top);
      const nextCenter = {
        ...curPos,
        zoom: lastCenter?.zoom ?? DEFAULT_ZOOM,
      };
      setCurPosition(curPos);
      setCenter(nextCenter);
      setLastCenter(nextCenter);
      if (!nav.start) {
        const res = await getAddress(curPos);
        if (res === null) return;
        const addressName = res?.road_address || res?.address;
        setNav({
          ...nav,
          start: {
            name: addressName
              ? t('place.currentWithAddress', {address: addressName})
              : t('place.current'),
            coordinate: curPos,
          },
        });
      }
    } catch {
      setCurPosition(null);
      if (!initial) {
        const isPermissionDenied = await checkPermissions();
        if (!isPermissionDenied) {
          Toast.show({
            type: 'error',
            text1: t('location.failed'),
            text2: t('location.tryAgain'),
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
      }
    } finally {
      setIsCenterInitializing(false);
    }
  };

  const backToList = () => {
    setListModalVisible(true);
  };

  const onUseEffect = async () => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevNavRef.current = nav;
      if (!selectedRoute) await setCurPos(true);
      return;
    }
    //move to corresponding location when start, end, or waypoints are updated
    else if (JSON.stringify(nav) !== JSON.stringify(prevNavRef.current)) {
      if (
        JSON.stringify(nav.start) !==
          JSON.stringify(prevNavRef.current?.start) &&
        nav.start?.coordinate
      ) {
        setCenter({...nav.start.coordinate, zoom: ENLARGE_ZOOM});
      } else if (
        JSON.stringify(nav.wayPoints) !==
        JSON.stringify(prevNavRef.current?.wayPoints)
      ) {
        const wayPoints = nav.wayPoints;
        if (wayPoints.length > 0) {
          const newCenter = {
            ...wayPoints[wayPoints.length - 1].coordinate,
            zoom: ENLARGE_ZOOM,
          };
          setCenter(newCenter);
        }
      } else if (
        JSON.stringify(nav.end) !== JSON.stringify(prevNavRef.current?.end) &&
        nav.end?.coordinate
      )
        setCenter({...nav.end.coordinate, zoom: ENLARGE_ZOOM});

      prevNavRef.current = nav;
    }

    if (nav.start && nav.end) {
      setOnSelectRoute(true);
    } else {
      setIsRough(false);
    }
  };

  useEffect(() => {
    onUseEffect();
    setModalVisible(false);
  }, [nav]);

  useEffect(() => {
    if (!selectedRoute) setResult(null);
  }, [selectedRoute]);

  return (
    <View className="relative w-full h-full">
      {isLoading || isCenterInitializing ? (
        <Spinner />
      ) : !center ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-base text-slate-600">
            {t('location.failed')}
          </Text>
          <TouchableOpacity
            className="rounded-lg bg-slate-800 px-5 py-3"
            onPress={() => setCurPos(false)}>
            <Text className="font-semibold text-white">
              {t('location.tryAgain')}
            </Text>
          </TouchableOpacity>
        </View>
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
            onMapClick={() => {
              setModalVisible(false);
              Keyboard.dismiss();
            }}
            onCameraChange={e => {
              setLastCenter({
                longitude: e.longitude,
                latitude: e.latitude,
                zoom: e.zoom,
              });
            }}
            onTouch={() => {
              if (nav.start && nav.end) setIsRough(true);
              Keyboard.dismiss();
            }}
            scaleBar
            compass>
            {curPosition && <CurPosMarker curPosition={curPosition} />}
            <NavMarker />
            {selectedRoute && selectedRoute.path.length > 0 && (
              <>
                {!showAlternative && (
                  <SearchRadiusIndicator
                    path={selectedRoute.path}
                    radiusKm={Math.min(searchRadiusKm, 20)}
                  />
                )}
                {originalResult && originalResult.length > 0 && result ? (
                  <>
                    <OmwMarker
                      resultList={result}
                      setShowAlternative={setShowAlternative}
                    />

                    {stopByData ? (
                      <>
                        <DefaultPath path={selectedRoute.path} />
                        <OMWPath path={stopByData.path} />
                      </>
                    ) : (
                      <SelectedPath path={selectedRoute.path} />
                    )}
                  </>
                ) : (
                  <SelectedPath path={selectedRoute.path} />
                )}
              </>
            )}
          </OmwMapView>
          {selectedRoute ? (
            <>
              <KeywordSearchBox
                selectedRoute={selectedRoute}
                result={result}
                setResult={setResult}
                setOriginalResult={setOriginalResult}
                query={query}
                setQuery={setQuery}
                showAlternative={showAlternative}
                setShowAlternative={setShowAlternative}
                radiusKm={searchRadiusKm}
                setRadiusKm={setSearchRadiusKm}
              />
              {showAlternative && (
                <>
                  {modalVisible ? (
                    <View
                      className={`absolute w-full bottom-1/3 items-center ${
                        Platform.OS === 'ios'
                          ? 'justify-center'
                          : 'justify-end pb-0'
                      }`}>
                      <View className="flex-row-reverse justify-between items-center absolute left-0 right-0 px-2.5 self-end">
                        <CurPosButton
                          onPress={() => setCurPos(false)}
                          style="relative self-end"
                        />
                        <BackToListButton onPress={backToList} />
                      </View>
                      <NaverMapLink
                        stopByStrategy={stopByData?.strategy}
                        avoidTolls={selectedRoute.avoidTolls}
                      />
                    </View>
                  ) : (
                    <>
                      {!listModalVisible ? (
                        <View className="absolute w-full bottom-10 items-center justify-center">
                          <View className="flex-row-reverse justify-between items-center absolute left-0 right-0 px-2.5">
                            <CurPosButton
                              onPress={() => setCurPos(false)}
                              style="relative self-center"
                            />
                            <BackToListButton onPress={backToList} />
                          </View>
                        </View>
                      ) : (
                        <CurPosButton onPress={() => setCurPos(false)} />
                      )}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <CurPosButton onPress={() => setCurPos(false)} />
          )}
        </>
      )}
      <ListBottomSheet
        result={result}
        setResult={setResult}
        originalResult={originalResult}
        showAlternative={showAlternative}
      />
    </View>
  );
}
