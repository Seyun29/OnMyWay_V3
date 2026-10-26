import {PlaceDetail} from '../types/coordinate';
import {NavDetail} from '../types/navigation';

interface TmapWayPoints {
  rV1Name: string;
  rV1Longitude: string;
  rV1Latitude: string;
  rV2Name: string | null;
  rV2Longitude: string | null;
  rV2Latitude: string | null;
  rV3Name: string | null;
  rV3Longitude: string | null;
  rV3Latitude: string | null;
}
//@ts-nocheck
export const createTmapWaypoints = (
  wayPoints: NavDetail[],
  curPlace: PlaceDetail,
  stopByStrategy: 'FRONT' | 'MIDDLE' | 'REAR' | undefined,
): TmapWayPoints => {
  const returnObj: TmapWayPoints = {
    rV1Name: curPlace.place_name,
    rV1Longitude: curPlace.x.toString(),
    rV1Latitude: curPlace.y.toString(),
    rV2Name: null,
    rV2Longitude: null,
    rV2Latitude: null,
    rV3Name: null,
    rV3Longitude: null,
    rV3Latitude: null,
  };
  if (wayPoints.length === 1) {
    if (stopByStrategy === 'FRONT') {
      returnObj.rV2Name = wayPoints[0].name;
      returnObj.rV2Longitude = wayPoints[0].coordinate.longitude.toString();
      returnObj.rV2Latitude = wayPoints[0].coordinate.latitude.toString();
    } else {
      returnObj.rV1Name = curPlace.place_name;
      returnObj.rV1Longitude = curPlace.x.toString();
      returnObj.rV1Latitude = curPlace.y.toString();
    }
  } else if (wayPoints.length === 2) {
    if (stopByStrategy === 'FRONT') {
      returnObj.rV2Name = wayPoints[0].name;
      returnObj.rV2Longitude = wayPoints[0].coordinate.longitude.toString();
      returnObj.rV2Latitude = wayPoints[0].coordinate.latitude.toString();
      returnObj.rV3Name = wayPoints[1].name;
      returnObj.rV3Longitude = wayPoints[1].coordinate.longitude.toString();
      returnObj.rV3Latitude = wayPoints[1].coordinate.latitude.toString();
    } else if ((stopByStrategy = 'MIDDLE')) {
      returnObj.rV1Name = wayPoints[0].name;
      returnObj.rV1Longitude = wayPoints[0].coordinate.longitude.toString();
      returnObj.rV1Latitude = wayPoints[0].coordinate.latitude.toString();
      returnObj.rV2Name = curPlace.place_name;
      returnObj.rV2Longitude = curPlace.x.toString();
      returnObj.rV2Latitude = curPlace.y.toString();
      returnObj.rV3Name = wayPoints[1].name;
      returnObj.rV3Longitude = wayPoints[1].coordinate.longitude.toString();
      returnObj.rV3Latitude = wayPoints[1].coordinate.latitude.toString();
    } else if (stopByStrategy === 'REAR') {
      returnObj.rV1Name = wayPoints[0].name;
      returnObj.rV1Longitude = wayPoints[0].coordinate.longitude.toString();
      returnObj.rV1Latitude = wayPoints[0].coordinate.latitude.toString();
      returnObj.rV2Name = wayPoints[1].name;
      returnObj.rV2Longitude = wayPoints[1].coordinate.longitude.toString();
      returnObj.rV2Latitude = wayPoints[1].coordinate.latitude.toString();
      returnObj.rV3Name = curPlace.place_name;
      returnObj.rV3Longitude = curPlace.x.toString();
      returnObj.rV3Latitude = curPlace.y.toString();
    }
  }
  return returnObj;
};
