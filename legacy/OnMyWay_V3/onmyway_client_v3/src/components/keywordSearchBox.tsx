import React, {useEffect, useState} from 'react';
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
import {useRecoilState, useRecoilValue} from 'recoil';
import {loadingState} from '../atoms/loadingState';
import Toast from 'react-native-toast-message';
import {WINDOW_WIDTH} from '../config/consts/style';
import {modalState} from '../atoms/modalState';
import {setMinMaxValue} from '../config/helpers/route';
import {listModalState} from '../atoms/listModalState';
import {getExtraPlaceData} from '../api/getExtraPlaceData';
import {headerHeightState} from '../atoms/headerHeightState';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ScrollView} from 'react-native-gesture-handler';
import {CATEGORY_LIST} from '../config/consts/query';
import CategorySVG from './categorySVG';

export default function KeywordSearchBox({
  selectedRoute,
  result,
  setResult,
  setOriginalResult,
  query,
  setQuery,
  showAlternative,
  setShowAlternative,
}: {
  selectedRoute: RouteDetail | null;
  result: PlaceDetail[] | null;
  setResult: any;
  setOriginalResult: any;
  query: string;
  setQuery: any;
  showAlternative: boolean;
  setShowAlternative: any;
}) {
  const insets = useSafeAreaInsets();

  const [, setLoading] = useRecoilState<boolean>(loadingState);
  const [, setModalVisible] = useRecoilState<boolean>(modalState);
  const [, setListModalVisible] = useRecoilState<boolean>(listModalState);
  const headerHeight = useRecoilValue<number>(headerHeightState);

  const [value, setValue] = useState<number>(1);
  const [isRangeOn, setIsRangeOn] = useState<boolean>(false);
  const [minMax, setMinMax] = useState<number[]>([0, 20]);

  const inputRef = React.useRef(null);

  const handleSelectRangeButton = () => {
    setIsRangeOn(!isRangeOn);
  };

  const onSubmit = async (categoryQuery?: string) => {
    if (query.length === 0 && !categoryQuery) return;

    Keyboard.dismiss();
    setLoading(true);
    // set timer for timeout (minimum 4 seconds)
    const timeoutId = setTimeout(() => {
      Toast.show({
        type: 'info',
        text1: '검색결과가 많아 응답이 지연되고 있습니다',
        text2: '정확한 추천을 위해 잠시만 기다려 주세요',
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
      query: categoryQuery || query,
      path,
      totalDistance,
      radius,
    });
    if (data && data.length > 0) {
      let resultList = data.map((res: PlaceDetail) => ({
        ...res,
        coordinate: {latitude: res.y, longitude: res.x},
      }));
      const promises = resultList.map(async (curPlace: PlaceDetail) => {
        //@ts-ignore
        const placeId = curPlace.place_url.match(/\/(\d+)$/)[1];
        const extraData = await getExtraPlaceData(placeId);
        return {
          ...curPlace,
          ...extraData,
        };
      });
      resultList = await Promise.all(promises);
      // clear timer for timeout
      clearTimeout(timeoutId);
      Toast.hide();

      setResult(resultList);
      setOriginalResult(resultList);
      setListModalVisible(true);
      //FIXME: BottomSheetComponent에서는 이미 extra data가 있는 경우에는 그대로 사용하게끔 수정
    } else {
      Toast.hide();
      clearTimeout(timeoutId);
      Toast.show({
        type: 'error',
        text1: '검색 결과가 없습니다.',
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
        if (inputRef.current)
          //@ts-ignore
          inputRef.current.focus();
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
            top: headerHeight,
            width: WINDOW_WIDTH,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          <TouchableOpacity
            className="rounded-full bg-white pl-5 pr-3 py-1.5 border-2 flex-row"
            style={{
              borderColor: '#9CC7FF',
            }}
            onPress={() => {
              setShowAlternative(false);
              setModalVisible(false);
              setListModalVisible(false);
              //@ts-ignore
              setTimeout(() => inputRef.current.focus(), 300);
            }}>
            <View className="border-r pr-2 mr-2 border-slate-500">
              <Text className="font-bold text-xs">
                {query.startsWith('카테고리 :') ? '카테고리' : '검색어'}
              </Text>
            </View>
            <Text className="text-xs mr-3">
              {query.startsWith('카테고리 :')
                ? query.split(':')[1].trim()
                : query}
            </Text>
            <KewordSearchButtonSVG height={'18px'} width={'18px'} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View
            style={{
              position: 'absolute',
              backgroundColor: 'transparent',
              top: headerHeight,
              width: WINDOW_WIDTH,
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
              {CATEGORY_LIST.map((category, index) => (
                <TouchableOpacity
                  key={index}
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
                    const newQuery = '카테고리 : ' + category.label;
                    onSubmit(newQuery);
                    setQuery(newQuery);
                  }}>
                  <CategorySVG code={category.code} />
                  <Text className="text-xs text-[#3D3D3D] font-semibold">
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={70} // 여기서 조정
            className="flex-1 absolute bottom-10 px-[16px] w-full">
            {isRangeOn && (
              <View className="px-[16px] bg-white mb-[12px] h-[88px] flex-row items-center justify-between rounded-[20px] shadow-md">
                <View className="flex flex-col w-full">
                  <View className="flex-row justify-between w-full pb-1">
                    <Text className="text-[#A8A8A8] text-[12px] font-bold">
                      검색 반경
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
              onPress={() => {
                // setIsRangeOn(true);
                //@ts-ignore
                if (inputRef.current) inputRef.current.focus();
              }}>
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
                placeholder="검색어 입력"
                value={query}
                onChangeText={setQuery}
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
