import React from 'react';
import OmwMapView from './omwMapView';
import {MapMarker} from './mapPrimitives';
import {View} from 'react-native';
import {Coordinate} from '../../config/types/coordinate';
import {LARGE_MARKER_HEIGHT, LARGE_MARKER_WIDTH} from '../../config/consts/map';
import {markerList} from '../../config/consts/image';

export default function ShowMap({coordinate}: {coordinate: Coordinate}) {
  return (
    <View className="relative w-full h-full">
      <OmwMapView
        center={{...coordinate, zoom: 18}} //initial Position
        style={{
          width: '100%',
          height: '100%',
        }}
        zoomControl={false}
        scaleBar>
        <MapMarker
          coordinate={coordinate}
          width={LARGE_MARKER_WIDTH}
          height={LARGE_MARKER_HEIGHT}
          image={markerList.basic.default}
        />
      </OmwMapView>
    </View>
  );
}
