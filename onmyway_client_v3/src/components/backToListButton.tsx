import React from 'react';
import {TouchableOpacity, Text} from 'react-native';
import BackToListSVG from '../assets/images/backToList.svg';

const BackToListButton = ({onPress}: {onPress: () => void}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row px-2 py-1.5 rounded-full bg-white items-center justify-center border border-gray-300"
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      <BackToListSVG width={20} height={20} />
      <Text className="text-[#6A6A6A] font-semibold ml-1 text-xs">리스트</Text>
    </TouchableOpacity>
  );
};

export default BackToListButton;
