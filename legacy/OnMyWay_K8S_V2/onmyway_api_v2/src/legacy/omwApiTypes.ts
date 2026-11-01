import { KakaoDrivingPathQuery } from '../apis/types/kakaoApiTypes';

// export interface SearchOnPathQuery extends KakaoDrivingPathQuery {
//   query: string;
//   category?: string;
//   radius: string;
// }

export interface SearchOnPathQuery {
  query: string;
  category?: string;
  radius: number; //radius has to be given as int, in 'meter' unit
  path: string[][]; //[ [x1, y1], [x2, y2], ... ]
  totalDistance: number;
}

export interface SearchOnPathResult {
  //TBU
}

export interface GetDrivingRouteQuery extends KakaoDrivingPathQuery {}

type DrivingRouteDetail = {
  duration: number;
  distance: number;
  path: string[][]; // [ [x1, y1], [x2, y2], ... ]
};

export interface GetDrivingRouteResult {
  result: DrivingRouteDetail;
}

export interface GetStopByDurationQuery extends KakaoDrivingPathQuery {}
export type GetStopByDurationResult = number; //returns number in 'minute' unit
