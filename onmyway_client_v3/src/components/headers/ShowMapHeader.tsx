import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {HEADER_LOGO_HEIGHT} from '../../config/consts/style';
import GoBackSVG from '../../assets/images/goBack.svg';
import {RootStackParam} from '../../navigations';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';

export default function ShowMapHeader() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParam>>();
  //FIXME: fix page transition animation (Android, IOS), fix font
  //FIXME: Fix the header shadow to be the same as MainHeader
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
        backgroundColor: 'white',
      }}>
      <View className="flex-row justify-between align-center w-full py-2 px-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}>
          <GoBackSVG
            width={HEADER_LOGO_HEIGHT}
            height={HEADER_LOGO_HEIGHT}
            color="black"
          />
        </TouchableOpacity>
        <Text className="text-lg">지도에서 보기</Text>
        <View
          className={`w-[${HEADER_LOGO_HEIGHT}] h-[${HEADER_LOGO_HEIGHT}]`}
        />
      </View>
    </View>
  );
}
