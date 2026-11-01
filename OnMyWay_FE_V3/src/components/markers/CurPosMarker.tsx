import React from 'react';
import {markerCurPosUndirected} from '../../config/consts/image';
import {MapMarker} from '../maps/mapPrimitives';
import {Coordinate} from '../../config/types/coordinate';

const CurPosMarker = ({curPosition}: {curPosition: Coordinate}) => {
  return (
    <MapMarker
      coordinate={curPosition}
      width={25}
      height={25}
      image={markerCurPosUndirected}
      zIndex={300}
    />
  );
};

export default CurPosMarker;
