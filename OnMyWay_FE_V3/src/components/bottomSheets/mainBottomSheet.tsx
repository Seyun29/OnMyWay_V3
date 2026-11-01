import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {useRecoilState} from '../../state/atom';
import {modalState} from '../../atoms/modalState';
import WebView from 'react-native-webview';
import Spinner from '../spinner';
import {curPlaceState} from '../../atoms/curPlaceState';
import {getKakaoPlace} from '../../api/getKakaoPlace';
import {getPlaceDetail} from '../../api/getPlaceDetail';
import {getPlacePhotoUrl} from '../../api/getPlacePhotoUrl';
import {parseKakaoPlaceExtraData} from '../../api/parseKakaoPlaceExtraData';
import {
  Coordinate,
  ExtraDetail,
  PlaceDetail,
} from '../../config/types/coordinate';
import BottomSheetComponent from './bottomSheetComponent';
import {getStopByDuration} from '../../api/getStopByDuration';
import {navigationState} from '../../atoms/navigationState';
import {RouteDetail} from '../../config/types/routes';
import {listModalState} from '../../atoms/listModalState';
import {selectedPlaceIndexState} from '../../atoms/selectedPlaceIndexState';
import {onSelectRouteState} from '../../atoms/onSelectRouteState';
import Toast from 'react-native-toast-message';
import {useTranslation} from '../../hooks/useTranslation';

export default function MainBottomSheet({
  selectedRoute,
  setSelectedRoute,
  stopByData,
  setStopByData,
}: {
  selectedRoute: RouteDetail | null;
  setSelectedRoute: React.Dispatch<React.SetStateAction<RouteDetail | null>>;
  stopByData: {
    strategy: 'FRONT' | 'REAR' | 'MIDDLE';
    duration: number;
    path: Coordinate[];
  } | null;
  setStopByData: (
    data: {
      strategy: 'FRONT' | 'REAR' | 'MIDDLE';
      duration: number;
      path: Coordinate[];
    } | null,
  ) => void;
}) {
  const {t} = useTranslation();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const requestGenerationRef = useRef(0);
  const [modalVisible, setModalVisible] = useRecoilState<boolean>(modalState);
  const [curPlace, setCurPlace] =
    useRecoilState<PlaceDetail | null>(curPlaceState);
  const [nav, setNav] = useRecoilState(navigationState);
  const [, setListModalVisible] = useRecoilState<boolean>(listModalState);
  const [, setSelected] = useRecoilState<number>(selectedPlaceIndexState);
  const [, setOnSelectRoute] = useRecoilState<boolean>(onSelectRouteState);

  const [curIdx, setCurIdx] = useState<number>(0);
  const [isWebViewLoading, setIsWebViewLoading] = useState<boolean>(false);
  const [webViewError, setWebViewError] = useState<boolean>(false);
  const [webViewReloadKey, setWebViewReloadKey] = useState(0);
  const [extra, setExtra] = useState<ExtraDetail>({});
  const [stopByLoading, setStopByLoading] = useState<boolean>(false);
  const [stopByPlaceKey, setStopByPlaceKey] = useState<string | null>(null);

  const snapPoints = useMemo(() => ['31%', '83%', '93%'], []);
  const placeKey =
    curPlace?.provider_place_id ??
    curPlace?.place_id ??
    curPlace?.place_url ??
    '';
  const detailUrl = curPlace?.place_url
    ? curPlace.place_url.replace(/^http:\/\//i, 'https://')
    : null;

  useEffect(() => {
    if (modalVisible) {
      setListModalVisible(false);
      setCurIdx(0);
      setWebViewError(false);
      setIsWebViewLoading(false);
      bottomSheetModalRef.current?.present();
      bottomSheetModalRef.current?.snapToIndex(0);
    } else {
      bottomSheetModalRef.current?.close();
    }
  }, [modalVisible]);

  useEffect(() => {
    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;
    setStopByPlaceKey(null);
    if (!curPlace || !selectedRoute) {
      setStopByLoading(false);
      return;
    }

    setCurIdx(0);
    setExtra({});
    setStopByData(null);
    setStopByLoading(true);
    setWebViewError(false);
    setIsWebViewLoading(false);
    bottomSheetModalRef.current?.snapToIndex(0);

    const loadStopBy = async () => {
      const res = await getStopByDuration(
        nav,
        curPlace.coordinate,
        selectedRoute?.priority,
        selectedRoute?.avoidTolls,
      );
      if (requestGenerationRef.current !== generation) return;
      if (res) {
        setStopByData({
          duration: res.duration,
          strategy: res.strategy,
          path: res.path,
        });
        setStopByPlaceKey(placeKey);
      }
      setStopByLoading(false);
    };

    const loadExtra = async () => {
      const kakaoPlaceId =
        curPlace.provider === 'KAKAO' || /place\.map\.kakao\.com/.test(curPlace.place_url)
          ? curPlace.provider_place_id ??
            curPlace.place_url.match(/\/(\d+)$/)?.[1]
          : undefined;

      let nextExtra: ExtraDetail = {};
      if (kakaoPlaceId) {
        nextExtra = parseKakaoPlaceExtraData(
          await getKakaoPlace(kakaoPlaceId),
        );
      } else if (curPlace.place_id) {
        const detail = await getPlaceDetail(curPlace.place_id);
        if (detail) {
          const photoUrl = getPlacePhotoUrl(detail.photo_reference);
          nextExtra = {
            ...(detail.open !== null ? {open: detail.open} : {}),
            ...(detail.parking !== null ? {parking: detail.parking} : {}),
            ...(detail.rating !== null
              ? {scoreAvg: detail.rating.toString()}
              : {}),
            ...(detail.rating_count !== null
              ? {commentCnt: detail.rating_count}
              : {}),
            ...(photoUrl ? {photoUrl} : {}),
          };
        }
      }

      if (requestGenerationRef.current === generation) {
        setExtra(nextExtra);
      }
    };

    loadStopBy().catch(() => {
      if (requestGenerationRef.current === generation) {
        setStopByLoading(false);
      }
    });
    loadExtra().catch(() => undefined);

    return () => {
      if (requestGenerationRef.current === generation) {
        requestGenerationRef.current += 1;
      }
    };
  }, [
    curPlace,
    nav,
    selectedRoute?.priority,
    selectedRoute?.avoidTolls,
  ]);

  const handleAddWaypoint = async () => {
    if (!curPlace || !selectedRoute) return;
    if (stopByLoading) {
      Toast.show({type: 'info', text1: t('waypoint.calculating')});
      return;
    }

    const candidate = {
      name: curPlace.place_name,
      coordinate: curPlace.coordinate,
    };
    const isSameCoordinate = (coordinate: Coordinate) =>
      Math.abs(coordinate.latitude - candidate.coordinate.latitude) < 0.000001 &&
      Math.abs(coordinate.longitude - candidate.coordinate.longitude) <
        0.000001;
    const isDuplicate = [nav.start, ...nav.wayPoints, nav.end].some(
      point => point && isSameCoordinate(point.coordinate),
    );

    if (isDuplicate) {
      Toast.show({type: 'info', text1: t('waypoint.duplicate')});
      return;
    }
    if (nav.wayPoints.length >= 2) {
      Toast.show({type: 'info', text1: t('waypoint.maxReached')});
      return;
    }

    let strategy =
      stopByPlaceKey === placeKey ? stopByData?.strategy : undefined;
    if (!strategy) {
      const generation = requestGenerationRef.current + 1;
      requestGenerationRef.current = generation;
      setStopByLoading(true);
      const res = await getStopByDuration(
        nav,
        curPlace.coordinate,
        selectedRoute.priority,
        selectedRoute.avoidTolls,
      );
      if (requestGenerationRef.current !== generation) return;
      setStopByLoading(false);
      if (!res?.strategy) {
        Toast.show({type: 'error', text1: t('waypoint.calculateFailed')});
        return;
      }
      strategy = res.strategy;
      setStopByData({
        duration: res.duration,
        strategy: res.strategy,
        path: res.path,
      });
      setStopByPlaceKey(placeKey);
    }

    const nextWayPoints =
      nav.wayPoints.length === 0
        ? [candidate]
        : strategy === 'REAR'
          ? [nav.wayPoints[0], candidate]
          : [candidate, nav.wayPoints[0]];

    setNav({...nav, wayPoints: nextWayPoints});
    setSelectedRoute(null);
    setStopByData(null);
    setStopByPlaceKey(null);
    setModalVisible(false);
    setListModalVisible(false);
    setCurPlace(null);
    setSelected(-1);
    setOnSelectRoute(true);
    Toast.show({type: 'success', text1: t('waypoint.added')});
  };

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        // v5부터 기본값이 true라 flex:1 컨텐츠가 0 높이로 측정되어 시트가 비어 보인다.
        enableDynamicSizing={false}
        onDismiss={() => setModalVisible(false)}
        onChange={index => {
          setCurIdx(index);
          if (index > 0) {
            setWebViewError(false);
            setIsWebViewLoading(true);
          }
        }}
        enableDismissOnClose
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.32,
          shadowRadius: 5.46,
          elevation: 9,
        }}>
        <BottomSheetView style={styles.sheetContent}>
          {curIdx > 0 && curPlace && (
            <View style={styles.webViewContainer}>
              {webViewError || !detailUrl ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {t('bottom.detailLoadFailed')}
                  </Text>
                  {detailUrl && (
                    <View style={styles.errorActions}>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                          setWebViewError(false);
                          setIsWebViewLoading(true);
                          setWebViewReloadKey(current => current + 1);
                        }}>
                        <Text style={styles.retryButtonText}>
                          {t('bottom.retry')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.externalButton}
                        onPress={() => Linking.openURL(detailUrl)}>
                        <Text style={styles.externalButtonText}>
                          {t('bottom.openMapPage')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <WebView
                    key={`${placeKey}-${webViewReloadKey}`}
                    source={{uri: detailUrl}}
                    style={styles.webView}
                    nestedScrollEnabled
                    originWhitelist={['http://*', 'https://*']}
                    mixedContentMode="compatibility"
                    onShouldStartLoadWithRequest={({url}) =>
                      /^https?:\/\//i.test(url)
                    }
                    onLoadStart={() => setIsWebViewLoading(true)}
                    onLoadEnd={() => setIsWebViewLoading(false)}
                    onError={() => {
                      setIsWebViewLoading(false);
                      setWebViewError(true);
                    }}
                    onHttpError={() => {
                      setIsWebViewLoading(false);
                      setWebViewError(true);
                    }}
                  />
                  {isWebViewLoading && (
                    <View style={styles.loadingOverlay}>
                      <Spinner />
                    </View>
                  )}
                </>
              )}
            </View>
          )}
          {curIdx === 0 && curPlace && (
            <View style={styles.compactCard}>
              <BottomSheetComponent
                placeInfo={{
                  ...curPlace,
                  ...extra,
                  stopByDuration: stopByData?.duration,
                  originalDuration: selectedRoute?.duration,
                }}
                stopByLoading={stopByLoading}
                addWaypointDisabled={!selectedRoute}
                onAddWaypoint={handleAddWaypoint}
                onPress={() => {
                  setWebViewError(false);
                  setIsWebViewLoading(true);
                  bottomSheetModalRef.current?.snapToIndex(1);
                }}
              />
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    bottom: 0,
    minHeight: 0,
  },
  webViewContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
  },
  compactCard: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#616161',
    fontSize: 14,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 16,
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#2D7FF9',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  externalButton: {
    borderWidth: 1,
    borderColor: '#2D7FF9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  externalButtonText: {
    color: '#2D7FF9',
    fontSize: 13,
    fontWeight: '600',
  },
});
