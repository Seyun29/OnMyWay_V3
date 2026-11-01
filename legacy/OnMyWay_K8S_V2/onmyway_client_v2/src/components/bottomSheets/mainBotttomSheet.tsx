import React, {useEffect, useMemo, useRef, useState} from 'react';
import {LayoutAnimation, Text, TouchableOpacity, View} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {useRecoilState, useRecoilValue} from 'recoil';
import {modalState} from '../../atoms/modalState';
import WebView from 'react-native-webview';
import Spinner from '../spinner';
import {curPlaceState} from '../../atoms/curPlaceState';
import {getKakaoPlace} from '../../api/getKakaoPlace';
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
import BlinkStarsSVG from '../../assets/images/blinkStars.svg';
import LockSVG from '../../assets/images/lock.svg';
import {getKakaoReviews, getReviewSummary} from '../../api/getReviewSummary';
import {userState} from '../../atoms/userState';

export default function MainBottomSheet({
  selectedRoute,
  stopByData,
  setStopByData,
}: {
  selectedRoute: RouteDetail | null;
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
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [modalVisible, setModalVisible] = useRecoilState<boolean>(modalState);
  const curPlace = useRecoilValue<PlaceDetail | null>(curPlaceState);
  const nav = useRecoilValue(navigationState);
  const [, setListModalVisible] = useRecoilState<boolean>(listModalState);

  const [curIdx, setCurIdx] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWebViewLoading, setIsWebViewLoading] = useState<boolean>(false);
  const [extra, setExtra] = useState<ExtraDetail>({});
  const [stopByLoading, setStopByLoading] = useState<boolean>(false);
  const [reviewSummaryLoading, setReviewSummaryLoading] =
    useState<boolean>(false);

  const [reviewSummary, setReviewSummary] = useState<string>('');
  const [dots, setDots] = useState<string>('.');
  const user = useRecoilValue(userState);

  const getStopBy = async () => {
    if (!curPlace) return;
    setStopByData(null);
    setStopByLoading(true);
    const res = await getStopByDuration(
      nav,
      curPlace.coordinate,
      selectedRoute?.priority,
      selectedRoute?.avoidTolls,
    );
    if (res) {
      setStopByData({
        duration: res.duration,
        strategy: res.strategy,
        path: res.path,
      });
    }
    setStopByLoading(false);
  };

  const snapPoints = useMemo(() => ['23%', '83%', '93%'], []);

  //@ts-ignore
  const placeId = curPlace ? curPlace.place_url.match(/\/(\d+)$/)[1] : '';

  const setExtraData = async () => {
    if (
      curPlace?.open ||
      curPlace?.tags ||
      curPlace?.photoUrl ||
      curPlace?.commentCnt ||
      curPlace?.reviewCnt
    )
      return;
    const res = await getKakaoPlace(placeId);

    let scoreAvg;
    if (
      res.comment?.scorecnt &&
      res.comment?.scorecnt !== 0 &&
      res.comment?.scoresum
    ) {
      const scorecnt = res.comment?.scorecnt;
      const scoresum = res.comment?.scoresum;
      scoreAvg = ((scoresum / (scorecnt * 5)) * 5).toFixed(1);
    }
    setExtra({
      open: res.basicInfo?.openHour?.realtime?.open,
      tags: res.basicInfo?.tags,
      photoUrl: res.photo?.photoList[0].list[0].orgurl
        ? res.photo?.photoList[0].list[0].orgurl.replace(
            /^http:\/\//i,
            'https://',
          )
        : null,
      commentCnt: res.comment?.kamapComntcnt,
      reviewCnt: res.blogReview?.blogrvwcnt,
      scoreAvg,
    });
  };

  const onReviewSummaryPress = async () => {
    setReviewSummaryLoading(true);
    // const res = await getReviewSummary(placeId);
    const res = await getReviewSummary(placeId);
    if (res) setReviewSummary(res);
    else
      setReviewSummary(
        '리뷰 요약을 생성할 수 없습니다.\n리뷰 개수가 너무 적거나 현재 서비스가 불안정합니다.',
      );
    bottomSheetModalRef.current?.snapToIndex(2);
    setReviewSummaryLoading(false);
  };

  useEffect(() => {
    if (modalVisible) {
      setListModalVisible(false);
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.close();
    }
  }, [modalVisible]);

  useEffect(() => {
    if (curPlace) {
      //webview bug fix (network error alert)
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 500); //bug fix ends

      getStopBy();
      setExtraData();
      setReviewSummary('');
    }
  }, [curPlace]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [reviewSummary]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (reviewSummaryLoading)
      interval = setInterval(() => {
        setDots(currentDots => {
          if (currentDots.length > 4) return '.';
          else return currentDots + '.';
        });
      }, 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [reviewSummaryLoading]);

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onDismiss={() => setModalVisible(false)}
        onChange={index => setCurIdx(index)}
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
        <BottomSheetView
          style={{
            flex: 1,
            zIndex: 100,
          }}>
          {curPlace &&
            (isLoading ? (
              <View className="absolute w-full h-full">
                <Spinner />
                <View className="w-full h-1/4 bg-white" />
              </View>
            ) : (
              <View className="flex-1">
                {/* FIXME: uncomment below to use ChatGPT API */}
                <TouchableOpacity
                  className="mx-4 px-4 py-2 bg-[#EBF2FF] rounded-lg justify-center"
                  onPress={onReviewSummaryPress}
                  disabled={
                    reviewSummaryLoading ||
                    reviewSummary.length > 0 ||
                    !user.isLoggedIn
                  }>
                  <View className="flex-row w-full items-center">
                    {user.isLoggedIn ? (
                      <BlinkStarsSVG width={17} height={17} />
                    ) : (
                      <LockSVG />
                    )}
                    {reviewSummary.length > 0 ? (
                      <>
                        <Text className="text-sm ml-1 text-[#2D7FF9] font-semibold">
                          AI 리뷰 요약
                        </Text>
                      </>
                    ) : reviewSummaryLoading ? (
                      <Text className="text-sm ml-1 text-[#2D7FF9] font-semibold">
                        {`리뷰 요약을 생성하는 중 입니다${dots}`}
                      </Text>
                    ) : (
                      <>
                        {user.isLoggedIn ? (
                          <>
                            <Text className="text-sm ml-1 text-[#2D7FF9] font-semibold">
                              AI 리뷰 요약을 확인해보세요
                            </Text>
                            <Text className="absolute right-4 text-sm ml-1 text-[#2D7FF9]">
                              Click!
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text className="text-xs ml-1 text-[#616060] font-semibold">
                              {
                                'On My Way 회원이 되시면 AI가 장소 리뷰를 요약해드려요'
                              }
                            </Text>
                          </>
                        )}
                      </>
                    )}
                  </View>
                  {reviewSummary.length > 0 && (
                    <Text className="text-sm mt-1 text-[#616060] leading-4">
                      {reviewSummary}
                    </Text>
                  )}
                </TouchableOpacity>
                <WebView
                  source={{
                    uri: curPlace.place_url.replace(/^http:\/\//i, 'https://'),
                  }}
                  style={{flex: 1}}
                  nestedScrollEnabled
                  // onLoadStart={() => setIsLoading(true)}
                  // onLoadEnd={() => {
                  //   setIsLoading(false);
                  // }}
                />
              </View>
            ))}
          {curIdx === 0 && curPlace && (
            <View className="absolute w-full h-full bg-white">
              <BottomSheetComponent
                placeInfo={{
                  ...extra,
                  ...curPlace,
                  stopByDuration: stopByData?.duration,
                  originalDuration: selectedRoute?.duration,
                }}
                stopByLoading={stopByLoading}
                onPress={() => {
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
