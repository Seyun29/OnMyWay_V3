import React from 'react';
import {RouteDetail} from '../config/types/routes';
import {ROUTE_PRIORITY_KEY} from '../config/consts/route';
import {Pressable, Text, TouchableOpacity, View} from 'react-native';
import {SELECT_ROUTE_ITEM_WIDTH} from '../config/consts/style';
import {formatRouteDuration} from '../config/helpers/route';
import SelectRouteSVG from '../assets/images/selectRoute.svg';
import {useTranslation} from '../hooks/useTranslation';

export default function SelectRouteItem({
  item,
  onSelect,
}: {
  item: RouteDetail;
  onSelect: () => void;
}) {
  const {t} = useTranslation();
  const kilometers = item.distance / 1000;
  const duration = formatRouteDuration(item.duration);

  return (
    <Pressable
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
      className="bg-transparent px-3 py-1 justify-center items-center">
      <View className="bg-white flex-row justify-between items-center rounded-lg px-4 pt-3 pb-4 w-full">
        <View className="items-start">
          <Text className="text-center text-sm font-bold mb-2">
            {t(ROUTE_PRIORITY_KEY[item.priority])}
          </Text>
          <View className="flex-row gap-2 items-end">
            <Text className="text-2xl" style={{color: '#2D7FF9'}}>
              {duration}
            </Text>
            <Text className="text-sm pb-1">{`${kilometers.toFixed(1)}km`}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onSelect}>
          <SelectRouteSVG width={60} height={60} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
