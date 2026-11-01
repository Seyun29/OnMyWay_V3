import React from 'react';
import {Text, View} from 'react-native';
import {SELECT_ROUTE_ITEM_WIDTH} from '../config/consts/style';
import {TranslationKey} from '../config/language';
import {useTranslation} from '../hooks/useTranslation';

export default function SelectRouteEmptyItem({
  messageKey,
}: {
  messageKey: TranslationKey;
}) {
  const {t} = useTranslation();

  return (
    <View
      style={{
        width: SELECT_ROUTE_ITEM_WIDTH,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
      className="bg-transparent px-3 py-1 justify-center items-center"
      accessibilityRole="alert">
      <View className="bg-white justify-center items-center rounded-lg px-4 pt-3 pb-4 w-full min-h-[76px]">
        <Text
          className="text-center text-sm font-bold"
          style={{color: '#A8A8A8'}}>
          {t(messageKey)}
        </Text>
      </View>
    </View>
  );
}
