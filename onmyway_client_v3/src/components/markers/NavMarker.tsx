import React from 'react';
import {markerList} from '../../config/consts/image';
import {Marker} from 'react-native-nmap';
import {useRecoilValue} from 'recoil';
import {Navigation} from '../../config/types/navigation';
import {navigationState} from '../../atoms/navigationState';
import {NAV_MARKER_HEIGHT, NAV_MARKER_WIDTH} from '../../config/consts/map';

const NavMarker = () => {
  const nav = useRecoilValue<Navigation>(navigationState);

  return (
    <>
      {nav.start && (
        <Marker
          coordinate={nav.start.coordinate}
          width={NAV_MARKER_WIDTH}
          height={NAV_MARKER_HEIGHT}
          image={markerList.start}
          zIndex={300} //FIXME: adjust zIndex
        />
      )}
      {nav.wayPoints.map((wayPoint, index) => (
        <Marker
          key={index}
          coordinate={wayPoint.coordinate}
          width={NAV_MARKER_WIDTH}
          height={NAV_MARKER_HEIGHT}
          image={markerList.stopover}
          zIndex={300} //FIXME: adjust zIndex
        />
      ))}
      {nav.end && (
        <Marker
          coordinate={nav.end.coordinate}
          width={NAV_MARKER_WIDTH}
          height={NAV_MARKER_HEIGHT}
          image={markerList.end}
          zIndex={300} //FIXME: adjust zIndex
        />
      )}
    </>
  );
};

export default NavMarker;
