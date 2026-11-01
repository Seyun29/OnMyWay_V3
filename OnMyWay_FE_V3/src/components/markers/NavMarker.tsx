import React from 'react';
import {markerList} from '../../config/consts/image';
import {MapMarker} from '../maps/mapPrimitives';
import {useRecoilValue} from '../../state/atom';
import {Navigation} from '../../config/types/navigation';
import {navigationState} from '../../atoms/navigationState';
import {NAV_MARKER_HEIGHT, NAV_MARKER_WIDTH} from '../../config/consts/map';
import {useTranslation} from '../../hooks/useTranslation';

const NavMarker = () => {
  const nav = useRecoilValue<Navigation>(navigationState);
  const {language} = useTranslation();
  const navigationMarkers = markerList.navigation[language];

  return (
    <>
      {nav.start && (
        <MapMarker
          coordinate={nav.start.coordinate}
          width={NAV_MARKER_WIDTH}
          height={NAV_MARKER_HEIGHT}
          image={navigationMarkers.start}
          zIndex={300}
        />
      )}
      {nav.wayPoints.map((wayPoint, index) => (
        <MapMarker
          key={index}
          coordinate={wayPoint.coordinate}
          width={NAV_MARKER_WIDTH}
          height={NAV_MARKER_HEIGHT}
          image={navigationMarkers.stopover}
          zIndex={300}
        />
      ))}
      {nav.end && (
        <MapMarker
          coordinate={nav.end.coordinate}
          width={NAV_MARKER_WIDTH}
          height={NAV_MARKER_HEIGHT}
          image={navigationMarkers.end}
          zIndex={300}
        />
      )}
    </>
  );
};

export default NavMarker;
