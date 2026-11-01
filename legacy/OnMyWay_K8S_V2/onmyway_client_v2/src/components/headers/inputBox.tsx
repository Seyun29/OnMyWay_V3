import React from 'react';
import {TouchableOpacity, Text} from 'react-native';
import {useRecoilValue} from 'recoil';
import {loadingState} from '../../atoms/loadingState';

export default function InputBox({
  onPress,
  text,
  altText,
  children,
}: {
  onPress: () => void;
  text?: null | string;
  altText?: string;
  children?: React.ReactNode;
}) {
  const isLoading = useRecoilValue<boolean>(loadingState);
  return (
    <TouchableOpacity
      className={
        'w-full h-[40px] bg-[#F2F2F2] mb-[2px] px-[12px] flex-row items-center rounded-sm'
      }
      onPress={onPress}
      disabled={isLoading}>
      {children}
      {text ? (
        <Text className="text-[#3D3D3D]">{text}</Text>
      ) : (
        <Text className="text-gray-400">{altText}</Text>
      )}
    </TouchableOpacity>
  );
}
