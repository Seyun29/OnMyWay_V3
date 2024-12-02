//@ts-nocheck
import {NMAP_URL_SCHEME_PREFIX, NMAP_URL_SCHEME_SUFFIX} from '../consts/link';

export const createURLScheme = (
  start,
  end,
  wayPoints,
  curPlace,
  stopByStrategy,
) => {
  const NMAP_START = `slat=${start.coordinate.latitude}&slng=${start.coordinate.longitude}&sname=${start.name}`;
  const NMAP_END = `dlat=${end.coordinate.latitude}&dlng=${end.coordinate.longitude}&dname=${end.name}`;
  const stopByName = curPlace.place_name;
  const stopByLat = curPlace.y;
  const stopByLng = curPlace.x;

  let NAMP_WAYPOINTS = `v1lat=${stopByLat}&v1lng=${stopByLng}&v1name=${stopByName}`;
  if (wayPoints) {
    if (wayPoints.length === 1) {
      if (stopByStrategy === 'REAR')
        NAMP_WAYPOINTS = `v1lat=${wayPoints[0].coordinate.latitude}&v1lng=${wayPoints[0].coordinate.longitude}&v1name=${wayPoints[0].name}&v2lat=${stopByLat}&v2lng=${stopByLng}&v2name=${stopByName}`;
      else
        NAMP_WAYPOINTS = `v1lat=${stopByLat}&v1lng=${stopByLng}&v1name=${stopByName}&v2lat=${wayPoints[0].coordinate.latitude}&v2lng=${wayPoints[0].coordinate.longitude}&v2name=${wayPoints[0].name}`;
    } else if (wayPoints.length === 2) {
      if (stopByStrategy === 'FRONT')
        NAMP_WAYPOINTS = `v1lat=${stopByLat}&v1lng=${stopByLng}&v1name=${stopByName}&v2lat=${wayPoints[0].coordinate.latitude}&v2lng=${wayPoints[0].coordinate.longitude}&v2name=${wayPoints[0].name}&v3lat=${wayPoints[1].coordinate.latitude}&v3lng=${wayPoints[1].coordinate.longitude}&v3name=${wayPoints[1].name}`;
      else if (stopByStrategy === 'MIDDLE')
        NAMP_WAYPOINTS = `v1lat=${wayPoints[0].coordinate.latitude}&v1lng=${wayPoints[0].coordinate.longitude}&v1name=${wayPoints[0].name}&v2lat=${stopByLat}&v2lng=${stopByLng}&v2name=${stopByName}&v3lat=${wayPoints[1].coordinate.latitude}&v3lng=${wayPoints[1].coordinate.longitude}&v3name=${wayPoints[1].name}`;
      else
        NAMP_WAYPOINTS = `v1lat=${wayPoints[0].coordinate.latitude}&v1lng=${wayPoints[0].coordinate.longitude}&v1name=${wayPoints[0].name}&v2lat=${wayPoints[1].coordinate.latitude}&v2lng=${wayPoints[1].coordinate.longitude}&v2name=${wayPoints[1].name}&v3lat=${stopByLat}&v3lng=${stopByLng}&v3name=${stopByName}`;
    }
  }

  const NMAP_VALUE = wayPoints
    ? `${NMAP_START}&${NAMP_WAYPOINTS}&${NMAP_END}`
    : `${NMAP_START}&${NMAP_END}`;

  return NMAP_URL_SCHEME_PREFIX + NMAP_VALUE + NMAP_URL_SCHEME_SUFFIX;
};
