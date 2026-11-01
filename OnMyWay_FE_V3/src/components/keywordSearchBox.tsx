import React, {useEffect, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import {Slider} from '@react-native-assets/slider';
import SelectRangeButtonOffSVG from '../assets/images/selectRangeButtonOff.svg';
import SelectRangeButtonOnSVG from '../assets/images/selectRangeButtonOn.svg';
import KewordSearchButtonSVG from '../assets/images/kewordSearchButton.svg';
import {searchOnPath} from '../api/searchOnPath';
import {PlaceDetail} from '../config/types/coordinate';
import {RouteDetail} from '../config/types/routes';
import {useRecoilState, useRecoilValue} from '../state/atom';
import {loadingState} from '../atoms/loadingState';
import Toast from 'react-native-toast-message';
import {modalState} from '../atoms/modalState';
import {setMinMaxValue} from '../config/helpers/route';
import {listModalState} from '../atoms/listModalState';
import {getExtraPlaceData} from '../api/getExtraPlaceData';
import {headerHeightState} from '../atoms/headerHeightState';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ScrollView} from 'react-native-gesture-handler';
import {
  CATEGORY_BY_ID,
  CATEGORY_LIST,
  PlaceSearchQuery,
} from '../config/consts/query';
import CategorySVG from './categorySVG';
import {useTranslation} from '../hooks/useTranslation';
import {MAP_SEARCH_TOP_GAP} from '../config/consts/style';
import {getPlacePhotoUrl} from '../api/getPlacePhotoUrl';

export default function KeywordSearchBox({
  selectedRoute,
  result,
  setResult,
  setOriginalResult,
  query,
  setQuery,
  showAlternative,
  setShowAlternative,
  radiusKm: value,
  setRadiusKm: setValue,
}: {
  selectedRoute: RouteDetail | null;
  result: PlaceDetail[] | null;
  setResult: any;
  setOriginalResult: any;
  query: PlaceSearchQuery;
  setQuery: React.Dispatch<React.SetStateAction<PlaceSearchQuery>>;
  showAlternative: boolean;
  setShowAlternative: any;
  radiusKm: number;
  setRadiusKm: React.Dispatch<React.SetStateAction<number>>;
}) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const [, setLoading] = useRecoilState<boolean>(loadingState);
  const [, setModalVisible] = useRecoilState<boolean>(modalState);
  const [, setListModalVisible] = useRecoilState<boolean>(listModalState);
  const headerHeight = useRecoilValue<number>(headerHeightState);

  const [isRangeOn, setIsRangeOn] = useState<boolean>(true);
  const [minMax, setMinMax] = useState<number[]>([0, 20]);

  const inputRef = useRef<TextInput>(null);
  const delayedToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearDelayedToastTimeout = () => {
    if (delayedToastTimeoutRef.current) {
      clearTimeout(delayedToastTimeoutRef.current);
      delayedToastTimeoutRef.current = null;
    }
  };

  const handleSelectRangeButton = () => {
    setIsRangeOn(!isRangeOn);
  };

  const onSubmit = async (searchQuery: PlaceSearchQuery = query) => {
    if (searchQuery.kind === 'keyword' && searchQuery.value.length === 0)
      return;

    const backendQuery =
      searchQuery.kind === 'category'
        ? t(CATEGORY_BY_ID[searchQuery.categoryId].queryKey)
        : searchQuery.value;

    Keyboard.dismiss();
    setLoading(true);
    clearDelayedToastTimeout();
    delayedToastTimeoutRef.current = setTimeout(() => {
      Toast.show({
        type: 'info',
        text1: t('search.delayedTitle'),
        text2: t('search.delayedDetail'),
        position: 'top',
        topOffset: headerHeight + insets.top,
        visibilityTime: 10000,
        text1Style: {
          fontSize: 12,
          fontWeight: '600',
        },
        text2Style: {
          fontSize: 12,
          fontWeight: '400',
          color: '#3D3D3D',
        },
      });
    }, 4000);

    const path: number[][] = [];
    selectedRoute?.path?.map(coord => {
      path.push([coord.longitude, coord.latitude]);
    });
    const radius = value > 20 ? 20000 : value * 1000;
    const totalDistance = selectedRoute?.distance;
    const data = await searchOnPath({
      query: backendQuery,
      path,
      totalDistance,
      radius,
      ...(searchQuery.kind === 'category'
        ? {category_group_code: CATEGORY_BY_ID[searchQuery.categoryId].code}
        : {}),
    });
    if (data === null) {
      clearDelayedToastTimeout();
      setLoading(false);
      return;
    }
    if (data.length > 0) {
      let resultList = data.map((res: PlaceDetail) => ({
        ...res,
        photoUrl: res.photoUrl ?? getPlacePhotoUrl(res.photo_reference),
        coordinate: {latitude: res.y, longitude: res.x},
      }));
      const promises = resultList.map(async (curPlace: PlaceDetail) => {
        // Kakao place_url에서만 숫자 ID를 추출한다. 다른 provider URL이면 보강 없이 사용.
        const placeId = curPlace?.place_url?.match(/\/(\d+)$/)?.[1];
        if (!placeId) return curPlace;
        const extraData = await getExtraPlaceData(placeId);
        return {
          ...curPlace,
          ...extraData,
        };
      });
      resultList = await Promise.all(promises);
      clearDelayedToastTimeout();
      Toast.hide();

      setResult(resultList);
      setOriginalResult(resultList);
      setListModalVisible(true);
    } else {
      Toast.hide();
      clearDelayedToastTimeout();
      Toast.show({
        type: 'error',
        text1: t('search.noResults'),
        position: 'top',
        topOffset: headerHeight + insets.top,
        visibilityTime: 2500,
        text1Style: {
          fontSize: 13,
          fontWeight: '600',
        },
      });
      setResult(null);
      setOriginalResult(null);
    }
    setLoading(false);
  };

  useEffect(
    () => () => {
      clearDelayedToastTimeout();
    },
    [],
  );

  useEffect(() => {
    if (result && result.length > 0) {
      setShowAlternative(true);
    }
  }, [result]);

  useEffect(() => {
    if (selectedRoute) {
      const res = setMinMaxValue(selectedRoute.distance);
      setMinMax(res);
      setValue(Math.floor(res[0] + (res[1] - res[0]) * 0.15));
      if (res[0] === res[1]) setIsRangeOn(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [selectedRoute]);

  if (!selectedRoute) return null;

  return (
    <>
      {showAlternative ? (
        <View
          style={{
            position: 'absolute',
            backgroundColor: 'transparent',
            top: headerHeight + MAP_SEARCH_TOP_GAP,
            left: 0,
            right: 0,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          <TouchableOpacity
            className="rounded-2xl bg-white px-4 py-2 border-2 flex-row items-center"
            style={{
              borderColor: '#9CC7FF',
              maxWidth: '92%',
            }}
            accessibilityRole="button"
            accessibilityLabel={t('search.tapToSearchAgain')}
            onPress={() => {
              setResult(null);
              setOriginalResult(null);
              setShowAlternative(false);
              setModalVisible(false);
              setListModalVisible(false);
              setTimeout(() => inputRef.current?.focus(), 300);
            }}>
            <View className="mr-3 min-w-0">
              <View className="flex-row items-center min-w-0">
                <View className="border-r pr-2 mr-2 border-slate-400">
                  <Text className="font-bold text-xs">
                    {t(
                      query.kind === 'category'
                        ? 'search.category'
                        : 'search.keyword',
                    )}
                  </Text>
                </View>
                <Text className="text-xs flex-shrink" numberOfLines={1}>
                  {query.kind === 'category'
                    ? t(CATEGORY_BY_ID[query.categoryId].labelKey)
                    : query.value}
                </Text>
              </View>
              <Text className="text-[10px] text-[#5B8FD9] mt-1">
                {t('search.tapToSearchAgain')}
              </Text>
            </View>
            <KewordSearchButtonSVG height={'20px'} width={'20px'} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View
            style={{
              position: 'absolute',
              backgroundColor: 'transparent',
              top: headerHeight + MAP_SEARCH_TOP_GAP,
              left: 0,
              right: 0,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}>
              {CATEGORY_LIST.map(category => (
                <TouchableOpacity
                  key={category.id}
                  className="flex-row px-2.5 py-1.5 justify-center items-center bg-white mr-3 rounded-full gap-x-1"
                  style={{
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                  }}
                  onPress={() => {
                    const newQuery: PlaceSearchQuery = {
                      kind: 'category',
                      categoryId: category.id,
                    };
                    onSubmit(newQuery);
                    setQuery(newQuery);
                  }}>
                  <CategorySVG code={category.code} />
                  <Text className="text-xs text-[#3D3D3D] font-semibold">
                    {t(category.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={70}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 40,
              paddingHorizontal: 16,
            }}>
            {isRangeOn && (
              <View className="px-[16px] bg-white mb-[12px] h-[88px] flex-row items-center justify-between rounded-[20px] shadow-md">
                <View className="flex flex-col w-full">
                  <View className="flex-row justify-between w-full pb-1">
                    <Text className="text-[#A8A8A8] text-[12px] font-bold">
                      {t('search.radius')}
                    </Text>
                    <Text className="text-[#3D3D3D] text-[12px] font-semibold">
                      {value}km
                    </Text>
                  </View>
                  <Slider
                    value={value}
                    onValueChange={setValue}
                    step={0.5}
                    minimumValue={minMax[0]}
                    maximumValue={minMax[1]}
                    trackStyle={{
                      height: 4,
                      backgroundColor: '#9CC7FF',
                      borderCurve: 'circular',
                    }}
                    thumbSize={17}
                    thumbStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#B5B9BD',
                      borderWidth: 0.5,
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 4},
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 1,
                    }}
                  />
                  <View className="flex-row justify-between w-full">
                    <Text
                      className={`text-[12px] ${
                        value >= Math.floor(minMax[0])
                          ? 'text-[#3D3D3D]'
                          : 'text-[#A8A8A8]'
                      }`}>
                      {`${minMax[0].toFixed(1)}km`}
                    </Text>
                    <Text
                      className={`text-[12px] ${
                        value >= minMax[0] + (minMax[1] - minMax[0]) / 4
                          ? 'text-[#3D3D3D]'
                          : 'text-[#A8A8A8]'
                      }`}>
                      {`${(minMax[0] + (minMax[1] - minMax[0]) / 4).toFixed(
                        1,
                      )}km`}
                    </Text>
                    <Text
                      className={`text-[12px] ${
                        value >= minMax[0] + (2 * (minMax[1] - minMax[0])) / 4
                          ? 'text-[#3D3D3D]'
                          : 'text-[#A8A8A8]'
                      }`}>
                      {`${(
                        minMax[0] +
                        (2 * (minMax[1] - minMax[0])) / 4
                      ).toFixed(1)}km`}
                    </Text>
                    <Text
                      className={`text-[12px] ${
                        value >= minMax[0] + (3 * (minMax[1] - minMax[0])) / 4
                          ? 'text-[#3D3D3D]'
                          : 'text-[#A8A8A8]'
                      }`}>
                      {`${(
                        minMax[0] +
                        (3 * (minMax[1] - minMax[0])) / 4
                      ).toFixed(1)}km`}
                    </Text>
                    <Text
                      className={`text-[12px] ${
                        value >= Math.floor(minMax[1])
                          ? 'text-[#3D3D3D]'
                          : 'text-[#A8A8A8]'
                      }`}>
                      {`${minMax[1].toFixed(1)}km`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            <TouchableOpacity
              className="w-full h-[45px] bg-white rounded-full shadow-md flex-row items-center px-[16px] justify-between"
              activeOpacity={0.8}
              disabled={result === null || result.length === 0}
              onPress={() => inputRef.current?.focus()}>
              <TouchableOpacity onPress={handleSelectRangeButton} className="">
                {isRangeOn ? (
                  <SelectRangeButtonOnSVG height={'24px'} width={'24px'} />
                ) : (
                  <SelectRangeButtonOffSVG height={'24px'} width={'24px'} />
                )}
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                className="w-[80%] h-full pl-3 text-black"
                placeholderTextColor={'#A8A8A8'}
                placeholder={t('search.placeholder')}
                value={
                  query.kind === 'keyword'
                    ? query.value
                    : t(CATEGORY_BY_ID[query.categoryId].labelKey)
                }
                onChangeText={inputValue =>
                  setQuery({kind: 'keyword', value: inputValue})
                }
                onSubmitEditing={() => onSubmit()}
              />
              <TouchableOpacity onPress={() => onSubmit()}>
                <KewordSearchButtonSVG height={'24px'} width={'24px'} />
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </>
      )}
    </>
  );
}
