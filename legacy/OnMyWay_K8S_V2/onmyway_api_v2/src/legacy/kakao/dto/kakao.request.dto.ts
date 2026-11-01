import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class KakaoKeywordSearchQuery {
  @ApiProperty({ example: '', required: true })
  query: string;
  category?: string; //FIXME: enum , literal type : https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword
  x?: string;
  y?: string;
  radius?: string;
}

export interface KakaoDrivingPathQuery {
  //FIXME: to include other options (using hipass, local roads only,, etc.)
  //FIXME: merge startX,startY and endX,endY
  origin: string; //e.g) "127.111202,37.394912"
  destination: string; //e.g) "127.111202,37.394912"
  waypoints?: string; //waypoints: 경유지 수만큼 "{X좌표},{Y좌표},,name={경유지명}" 또는 "{X좌표},{Y좌표},"를 | 또는 %7C로 연결하여 입력(예:127.111202,37.394912,name=판교역 | 127.112275,37.392815)
  summary?: boolean;
  alternatives?: boolean; //alternative has to be false. (one way to show for one preference of user)
  avoid?: 'toll' | 'motorway'; //toll: 유료 도로, motorway: 자동차 전용 도로
  priority?: 'RECOMMEND' | 'TIME' | 'DISTANCE'; //추천경로, 최단시간, 최단거리
}

export interface KakaoGetAddressQuery {
  x: string;
  y: string;
}

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
