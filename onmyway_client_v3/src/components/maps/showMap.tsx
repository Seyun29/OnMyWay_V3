import React from 'react';
import NaverMapView, {Marker} from 'react-native-nmap';
import {View} from 'react-native';
import {Coordinate} from '../../config/types/coordinate';
import {LARGE_MARKER_HEIGHT, LARGE_MARKER_WIDTH} from '../../config/consts/map';
import {markerList} from '../../config/consts/image';

export default function ShowMap({coordinate}: {coordinate: Coordinate}) {
  return (
    <View className="relative w-full h-full">
      <NaverMapView
        center={{...coordinate, zoom: 18}} //initial Position
        style={{
          width: '100%',
          height: '100%',
        }}
        zoomControl={false}
        scaleBar
        mapType={0} //0 : Basic, 1 : Navi, 4 : Terrain, etc..
      >
        <Marker
          coordinate={coordinate}
          width={LARGE_MARKER_WIDTH}
          height={LARGE_MARKER_HEIGHT}
          image={markerList.basic.default}
        />
      </NaverMapView>
    </View>
  );
}
