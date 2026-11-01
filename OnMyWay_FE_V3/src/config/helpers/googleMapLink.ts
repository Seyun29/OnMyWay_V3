import {PlaceDetail} from '../types/coordinate';
import {NavDetail} from '../types/navigation';
import {getOrderedStops, StopByStrategy} from './nmapLink';

const GOOGLE_DIRECTIONS_URL = 'https://www.google.com/maps/dir/';
const coordinateParam = ({latitude, longitude}: NavDetail['coordinate']) =>
  `${latitude},${longitude}`;
const queryParam = (key: string, value: string) =>
  `${key}=${encodeURIComponent(value)}`;

export const createGoogleMapsDirectionsUrl = (
  start: NavDetail,
  end: NavDetail,
  wayPoints: NavDetail[],
  curPlace: PlaceDetail,
  stopByStrategy: StopByStrategy,
  avoidTolls = false,
): string => {
  const orderedStops = getOrderedStops(
    wayPoints,
    curPlace,
    stopByStrategy,
  );
  const params = [
    'api=1',
    queryParam('origin', coordinateParam(start.coordinate)),
    queryParam('destination', coordinateParam(end.coordinate)),
    queryParam(
      'waypoints',
      orderedStops.map(stop => coordinateParam(stop.coordinate)).join('|'),
    ),
    'travelmode=driving',
    'dir_action=navigate',
  ];

  if (avoidTolls) params.push('avoid=tolls');
  return `${GOOGLE_DIRECTIONS_URL}?${params.join('&')}`;
};
