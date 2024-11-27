import React, {useState} from 'react';
import {TouchableOpacity, View, Dimensions, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParam} from '../../navigations';
import InputBoxEditable from './inputBoxEditable';
import CancelSVG from '../../assets/images/cancel.svg';
import {placeQuery} from '../../api/placeQuery';
import SelectOnMapSVG from '../../assets/images/selectOnMap.svg';
import CurPosInputSVG from '../../assets/images/curPosInput.svg';
import FavoriteSVG from '../../assets/images/favorite.svg';
import Toast from 'react-native-toast-message';
import {get} from '../../config/helpers/storage';
import {FAVORITE_KEY} from '../../config/consts/storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function PlaceInputHeader({
  setResultList,
  setIsResult,
  onCurPosPress,
  setLoading,
}: {
  setResultList: any;
  setIsResult: any;
  onCurPosPress: () => void;
  setLoading: (loading: boolean) => void;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParam>>();
  const [toastTopOffset, setToastTopOffset] = useState<number>(200);
  const insets = useSafeAreaInsets();

  const onFavoritePress = async () => {
    const favorites = await get(FAVORITE_KEY);
    if (favorites) {
      if (favorites?.places.length === 0)
        Toast.show({
          type: 'error',
          text1: '즐겨찾기가 없습니다',
          position: 'top',
          topOffset: toastTopOffset,
          visibilityTime: 1500,
          text1Style: {
            fontSize: 15,
            fontWeight: '600',
          },
        });
      else {
        setIsResult(true);
        setResultList(favorites.places);
      }
    } else
      Toast.show({
        type: 'error',
        // text1: '즐겨찾기를 가져오는데 실패했습니다',
        text1: '즐겨찾기가 없습니다',
        position: 'top',
        topOffset: toastTopOffset,
        visibilityTime: 1500,
        text1Style: {
          fontSize: 15,
          fontWeight: '600',
        },
      });
  };

  const handleSubmit = async (query: string) => {
    if (query.length === 0) return;
    //FIXME: 입력값이 '확실한' 주소일 경우, 주소만 resultList로 보여줘야함
    setLoading(true);
    const response = await placeQuery(query);
    if (response.length === 0) {
      setResultList([]);
      setIsResult(false);
      Toast.show({
        type: 'error',
        text1: '검색결과가 없습니다.',
        position: 'top',
        topOffset: toastTopOffset,
        visibilityTime: 1500,
        text1Style: {
          fontSize: 15,
          fontWeight: '600',
        },
      });
      setLoading(false);
      return;
    }
    //FIXME: Exception handling required here
    const newList = response.map((res: any) => ({
      placeName: res.place_name,
      addressName: res.address_name,
      roadAddressName: res.road_address_name,
      coordinate: {
        latitude: res.y,
        longitude: res.x,
      },
    }));
    setResultList(newList);
    setIsResult(true);
    setLoading(false);
  };
  return (
    <View
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
      onLayout={e =>
        setToastTopOffset(e.nativeEvent.layout.height + insets.top + 10)
      }
      className="bg-white w-full justify-start items-start px-[16px] pt-[16px] ">
      <View className="relative w-full flex-row items-center justify-around">
        <InputBoxEditable handleSubmit={handleSubmit} />
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}>
          <CancelSVG height={25} width={25} />
        </TouchableOpacity>
      </View>
      <View className="flex-row w-full items-center justify-between">
        <TouchableOpacity onPress={onCurPosPress}>
          <CurPosInputSVG />
        </TouchableOpacity>
        <TouchableOpacity onPress={onFavoritePress}>
          <FavoriteSVG />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SelectMap')}>
          <SelectOnMapSVG />
        </TouchableOpacity>
      </View>
    </View>
  );
}
