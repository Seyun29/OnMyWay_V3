import React from 'react';
import NaverMapView from 'react-native-nmap';
import {View} from 'react-native';
import {Center, Coordinate} from '../../config/types/coordinate';
import SelectMarker from '../../assets/images/markers/selectMarker.svg';
import Cross from '../../assets/images/markers/cross.svg';

export default function SelectMap({
  lastCenter,
  setCoord,
}: {
  lastCenter: Center;
  setCoord: (coord: Coordinate) => void;
}) {
  return (
    <View className="relative w-full h-full">
      <NaverMapView
        center={lastCenter} //initial Position
        style={{
          width: '100%',
          height: '100%',
        }}
        zoomControl={false}
        onCameraChange={e => {
          setCoord({
            longitude: e.longitude,
            latitude: e.latitude,
          });
        }}
        scaleBar
        mapType={0} //0 : Basic, 1 : Navi, 4 : Terrain, etc..
      />
      <View className="absolute top-1/2 left-1/2">
        <View
          style={{
            marginLeft: -20,
            marginTop: -40,
          }}>
          <SelectMarker width={40} height={40} />
        </View>
        <View
          style={{
            marginLeft: -6,
            marginTop: -6, //for centering
            zIndex: 1,
          }}>
          <Cross width={12} height={12} />
        </View>
      </View>
    </View>
  );
}
