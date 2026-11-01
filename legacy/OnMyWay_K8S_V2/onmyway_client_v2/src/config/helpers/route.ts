import {Coordinate} from '../types/coordinate';
import {Navigation} from '../types/navigation';

export const calculateIsInBoundary = (
  nav: Navigation,
  coveringRegion: Coordinate[],
): boolean => {
  const max_lat = Math.max(...coveringRegion.map(coord => coord.latitude));
  const min_lat = Math.min(...coveringRegion.map(coord => coord.latitude));
  const max_lon = Math.max(...coveringRegion.map(coord => coord.longitude));
  const min_lon = Math.min(...coveringRegion.map(coord => coord.longitude));
  if (nav.start && nav.end) {
    if (
      nav.start.coordinate.latitude > max_lat ||
      nav.start.coordinate.latitude < min_lat ||
      nav.start.coordinate.longitude > max_lon ||
      nav.start.coordinate.longitude < min_lon
    )
      return false;
    if (
      nav.end.coordinate.latitude > max_lat ||
      nav.end.coordinate.latitude < min_lat ||
      nav.end.coordinate.longitude > max_lon ||
      nav.end.coordinate.longitude < min_lon
    )
      return false;
    for (let i = 0; i < nav.wayPoints.length; i++) {
      if (
        nav.wayPoints[i].coordinate.latitude > max_lat ||
        nav.wayPoints[i].coordinate.latitude < min_lat ||
        nav.wayPoints[i].coordinate.longitude > max_lon ||
        nav.wayPoints[i].coordinate.longitude < min_lon
      )
        return false;
    }
  }
  return true;
};

export const getZoomLevel = (distance: number | undefined) => {
  //FIXME: Seperate cases in more detail!!
  /*
  ZOOM
  15 - < 1km
  14 - 1km ~ 2km
  13 - 2km ~ 4km
  12 - 4km ~ 6km
  11 - 6km ~ 12km
  10 - 12km ~ 30km
  9 - 30km ~ 60km
  8 - 60km ~ 100km
  7 - 100km ~ 200km
  6 - 200km ~
  */
  if (!distance) return 12;
  if (distance < 1000) return 16;
  if (distance < 1500) return 15.5;
  if (distance < 2000) return 15;
  if (distance < 3000) return 14.5;
  if (distance < 4000) return 14;
  if (distance < 5000) return 13.5;
  if (distance < 6000) return 13;
  if (distance < 8000) return 12.7;
  if (distance < 10000) return 12.3;
  if (distance < 12000) return 12;
  if (distance < 21000) return 11.5;
  if (distance < 30000) return 11;
  if (distance < 40000) return 10.7;
  if (distance < 50000) return 10.3;
  if (distance < 60000) return 10;
  if (distance < 80000) return 9.5;
  if (distance < 100000) return 9;
  if (distance < 150000) return 8.5;
  if (distance < 400000) return 8;
  return 7;
};

export const setMinMaxValue = (totalDistance: number) => {
  if (totalDistance > 400000) return [20, 25]; //trick
  else {
    const minValue = Math.max(1, Math.floor(totalDistance / 20000));
    let maxValue = Math.max(1, Math.min(20, Math.floor(totalDistance / 1000)));
    if (minValue > 15) maxValue = minValue + 5; //trick
    return [minValue, maxValue];
  }
};
