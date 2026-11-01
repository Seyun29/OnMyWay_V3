import React from 'react';
import {RouteDetail} from '../config/types/routes';
import {ROUTE_PRIORITY_TEXT} from '../config/consts/route';
import {Pressable, Text, TouchableOpacity, View} from 'react-native';
import {SELECT_ROUTE_ITEM_WIDTH} from '../config/consts/style';
import SelectRouteSVG from '../assets/images/selectRoute.svg';

export default function SelectRouteItem({
  item,
  onSelect,
}: {
  item: RouteDetail;
  onSelect: () => void;
}) {
  // Convert each to hours, minutes, kilometers
  const hours = Math.floor(item.duration / 3600);
  const minutes = Math.floor((item.duration % 3600) / 60);
  const kilometers = item.distance / 1000;
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
            {ROUTE_PRIORITY_TEXT[item.priority]}
          </Text>
          <View className="flex-row gap-2 items-end">
            <Text className="text-2xl" style={{color: '#2D7FF9'}}>
              {hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`}
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
