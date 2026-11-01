import React, {useState} from 'react';
import {Keyboard, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParam} from '../../navigations';
import InputBoxEditable from './inputBoxEditable';
import CancelSVG from '../../assets/images/cancel.svg';
import {placeQuery} from '../../api/placeQuery';
import SelectOnMapIcon from '../../assets/images/selectOnMapIcon.svg';
import CurrentLocationIcon from '../../assets/images/currentLocationIcon.svg';
import FavoriteIcon from '../../assets/images/favoriteIcon.svg';
import Toast from 'react-native-toast-message';
import {get} from '../../config/helpers/storage';
import {FAVORITE_KEY} from '../../config/consts/storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from '../../hooks/useTranslation';

export default function PlaceInputHeader({
  setResultList,
  setIsResult,
  onCurPosPress,
  setLoading,
  onHeightChange,
}: {
  setResultList: any;
  setIsResult: any;
  onCurPosPress: () => void;
  setLoading: (loading: boolean) => void;
  onHeightChange: (height: number) => void;
}) {
  const {t} = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParam>>();
  const [toastTopOffset, setToastTopOffset] = useState<number>(200);
  const insets = useSafeAreaInsets();

  const onFavoritePress = async () => {
    const favorites = await get(FAVORITE_KEY);
    if (favorites) {
      if (favorites?.places.length === 0)
        Toast.show({
          type: 'error',
          text1: t('favorite.empty'),
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
        text1: t('favorite.empty'),
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
    if (query.trim().length === 0) return;
    Keyboard.dismiss();
    setLoading(true);
    const response = await placeQuery(query.trim());
    if (response === null) {
      setResultList([]);
      setIsResult(false);
      Toast.show({
        type: 'error',
        text1: t('search.loadFailed'),
        position: 'top',
        topOffset: toastTopOffset,
        visibilityTime: 2500,
      });
      setLoading(false);
      return;
    }
    if (response.length === 0) {
      setResultList([]);
      setIsResult(false);
      Toast.show({
        type: 'error',
        text1: t('search.noResultsCompact'),
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
      onLayout={e => {
        const height = e.nativeEvent.layout.height;
        setToastTopOffset(height + insets.top + 10);
        onHeightChange(height);
      }}
      className="bg-white w-full justify-start items-start px-[16px] pt-[16px]">
      <View className="relative w-full flex-row items-center justify-between">
        <InputBoxEditable handleSubmit={handleSubmit} />
        <TouchableOpacity
          style={{marginLeft: 12, flexShrink: 0}}
          hitSlop={10}
          onPress={() => {
            navigation.goBack();
          }}>
          <CancelSVG height={25} width={25} />
        </TouchableOpacity>
      </View>
      <View className="flex-row w-full items-stretch">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('place.current')}
          className="min-h-[56px] flex-1 flex-row items-center justify-center px-1"
          onPress={onCurPosPress}>
          <CurrentLocationIcon />
          <Text className="ml-1.5 flex-shrink text-center text-[13px] text-[#6A6A6A]">
            {t('place.current')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('favorite.short')}
          className="min-h-[56px] flex-1 flex-row items-center justify-center px-1"
          onPress={onFavoritePress}>
          <FavoriteIcon />
          <Text className="ml-1.5 flex-shrink text-center text-[13px] text-[#6A6A6A]">
            {t('favorite.short')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('map.selectTitle')}
          className="min-h-[56px] flex-1 flex-row items-center justify-center px-1"
          onPress={() => navigation.navigate('SelectMap')}>
          <SelectOnMapIcon />
          <Text className="ml-1.5 flex-shrink text-center text-[13px] text-[#6A6A6A]">
            {t('map.selectTitle')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
