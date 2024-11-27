import React, {useState} from 'react';
import {Pressable, View, Text, TextInput, Button} from 'react-native';
import NaverMap from '../../components/maps/naverMap';
import MainBottomSheet from '../../components/bottomSheets/mainBotttomSheet';
import {useRecoilState, useRecoilValue} from 'recoil';
import MainHeader from '../../components/headers/mainHeader';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Drawer} from 'react-native-drawer-layout';
import {drawerState} from '../../atoms/drawerState';
import {onSelectRouteState} from '../../atoms/onSelectRouteState';
import SelectRouteMap from '../../components/maps/selectRouteMap';
import {RouteDetail} from '../../config/types/routes';
import {Coordinate} from '../../config/types/coordinate';
import {login, logout, register} from '../../api/auth';
import DrawerView from '../../components/drawer/drawerView';

export const HomeScreen = () => {
  // const modalVisible = useRecoilValue<boolean>(modalState);
  const [isDrawerOpen, setIsDrawerOpen] = useRecoilState<boolean>(drawerState);
  const onSelectRoute = useRecoilValue<boolean>(onSelectRouteState);
  const [selectedRoute, setSelectedRoute] = useState<RouteDetail | null>(null);
  const [stopByData, setStopByData] = useState<{
    strategy: 'FRONT' | 'REAR' | 'MIDDLE';
    duration: number;
    path: Coordinate[];
  } | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-white w-full h-full">
      <Drawer
        open={isDrawerOpen}
        onOpen={() => setIsDrawerOpen(true)}
        onClose={() => setIsDrawerOpen(false)}
        drawerType="front"
        renderDrawerContent={() => {
          return <DrawerView />;
        }}>
        <Pressable
          className="flex-1"
          onPress={() => {
            setIsDrawerOpen(false);
          }}>
          <View className="flex-1">
            {onSelectRoute ? (
              <SelectRouteMap setSelectedRoute={setSelectedRoute} />
            ) : (
              <NaverMap selectedRoute={selectedRoute} stopByData={stopByData} />
            )}
          </View>
          <View className="top-0 absolute w-full overflow-hidden pb-[8px]">
            <MainHeader setSelectedRoute={setSelectedRoute} />
          </View>
          <MainBottomSheet
            selectedRoute={selectedRoute}
            stopByData={stopByData}
            setStopByData={setStopByData}
          />
        </Pressable>
      </Drawer>
    </SafeAreaView>
  );
};
