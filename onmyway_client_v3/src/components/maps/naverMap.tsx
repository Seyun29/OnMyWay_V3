import NaverMapView from 'react-native-nmap';
import React, {useRef, useEffect, useState} from 'react';
import {Keyboard, Platform, View} from 'react-native';
import {useRecoilState, useRecoilValue} from 'recoil';
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
import {DefaultPath, OMWPath, SelectedPath} from '../paths/candidatePaths';
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

export default function NaverMap({
  selectedRoute,
  stopByData,
}: {
  selectedRoute: RouteDetail | null;
  stopByData: any;
}) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useRecoilState<boolean>(modalState);
  const [listModalVisible, setListModalVisible] =
    useRecoilState<boolean>(listModalState);
  const [, setIsRough] = useRecoilState<boolean>(headerRoughState);
  const [lastCenter, setLastCenter] = useRecoilState<Center>(lastCenterState);
  const isLoading = useRecoilValue<boolean>(loadingState);
  const [nav, setNav] = useRecoilState<Navigation>(navigationState);

  const [center, setCenter] = useRecoilState<Center>(mapCenterState);
  const [, setOnSelectRoute] = useRecoilState<boolean>(onSelectRouteState);
  const headerHeight = useRecoilValue<number>(headerHeightState);

  const [curPosition, setCurPosition] = useState<Coordinate | null>(null);

  //for filtering the result
  const [originalResult, setOriginalResult] = useState<PlaceDetail[] | null>(
    null,
  );
  const [result, setResult] = useState<PlaceDetail[] | null>(null);

  const [query, setQuery] = useState<string>('');
  const [showAlternative, setShowAlternative] = useState<boolean>(false);

  const prevNavRef = useRef<Navigation | null>(nav);
  const isFirstMount = useRef<boolean>(true);

  const setCurPos = async (initial?: boolean) => {
    try {
      const curPos = await getCurPosition(initial, headerHeight + insets.top);
      setCurPosition(curPos);
      setCenter({...curPos, zoom: 15}); //Cheat Shortcut for fixing centering bug
      setCenter({...curPos, zoom: lastCenter.zoom || DEFAULT_ZOOM});
      if (!nav.start) {
        const res = await getAddress(curPos);
        setNav({
          ...nav,
          start: {
            name: '현위치 : ' + (res.road_address || res.address),
            coordinate: curPos,
          },
        });
      }
    } catch (error) {
      setCurPosition(null);
      if (!initial) {
        const isPermissionDenied = await checkPermissions();
        if (!isPermissionDenied) {
          Toast.show({
            type: 'error',
            text1: '현재 위치를 가져오는데 실패했습니다.',
            text2: '잠시 후 다시 시도해주세요',
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
      console.error(error);
    }
  };

  const backToList = () => {
    //TODO: implement feature here
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

  //TODO: Make SEARCH ON PATH API request, render the result on the map (OMWMARKER)
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
            onMapClick={e => {
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
            compass
            mapType={0} //0 : Basic, 1 : Navi, 4 : Terrain, etc..
          >
            {curPosition && <CurPosMarker curPosition={curPosition} />}
            <NavMarker />
            {selectedRoute && selectedRoute.path.length > 0 && (
              <>
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
          </NaverMapView>
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
              />
              {showAlternative && (
                <>
                  {modalVisible ? (
                    <View
                      className={`absolute w-full bottom-1/4 items-center ${
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
                      <NaverMapLink stopByStrategy={stopByData?.strategy} />
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
