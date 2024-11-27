import { ApiProperty } from '@nestjs/swagger';
class AddressType {
  @ApiProperty({ example: '서울특별시 강남구 테헤란로 53' })
  road_address: string | undefined;
  @ApiProperty({ example: '서울특별시 강남구 역삼동 102-1' })
  address: string;
}
export class GetAddressResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({
    type: [AddressType],
  })
  data: AddressType[];
}

class PlaceType {
  // @ApiProperty()
  // 'category_group_code': string | ''; //FIXME: list up all possible category codes and make it enum (literal)
  // @ApiProperty()
  // 'category_group_name': string | '';
  // @ApiProperty({ example: '문화,예술 > 종교 > 기독교 > 교회' })
  // 'category_name': string; // @ApiProperty({ example: '8162856' })
  // 'id': string;
  // @ApiProperty({ example: '051-209-0191' })
  // 'phone': string;
  // @ApiProperty({
  //   example: '',
  //   description: "'' if x,y coordinates are not given as query input",
  // })
  // 'distance': string | '';
  @ApiProperty({ example: '호산나교회', required: false })
  'place_name'?: string;

  @ApiProperty({
    example: 'http://place.map.kakao.com/8162856',
    required: false,
  })
  'place_url'?: string;

  @ApiProperty({ example: '부산 강서구 명지오션시티6로 2', required: false })
  'road_address_name'?: string;

  @ApiProperty({ example: '부산 강서구 명지동 3245-5' })
  'address_name': string;

  @ApiProperty({ example: 128.907353175642 })
  'x': number;

  @ApiProperty({ example: 35.0859058483527 })
  'y': number;
}
export class GetKeywordSearchResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({
    type: [PlaceType],
  })
  data: PlaceType[];
}

class Coordinate {
  @ApiProperty({
    example: 37.5858189680129,
    description: '위도, y',
  })
  latitude: number;
  @ApiProperty({
    example: 127.021344106907,
    description: '경도, x',
  })
  longitude: number;
}
class DrivingRouteDetail {
  @ApiProperty({
    example: 'RECOMMEND',
    description: 'RECOMMEND, TIME, DISTANCE',
  })
  priority: 'RECOMMEND' | 'TIME' | 'DISTANCE';
  @ApiProperty({ example: 60, description: 'in seconds' })
  duration: number;
  @ApiProperty({ example: 5000, description: 'in meters' })
  distance: number;
  @ApiProperty({
    example: [
      { latitude: 37.5858189680129, longitude: 127.021344106907 },
      { latitude: 37.5858189680129, longitude: 127.021344106907 },
    ],
    type: [Coordinate],
  })
  path: Coordinate[];
}

export class GetDrivingRouteResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({
    example: [
      {
        priority: 'RECOMMEND',
        duration: 60,
        distance: 5000,
        path: [
          { latitude: 37.5858189680129, longitude: 127.021344106907 },
          { latitude: 37.5858189680129, longitude: 127.021344106907 },
        ],
      },
      {
        priority: 'TIME',
        duration: 60,
        distance: 5000,
        path: [
          { latitude: 37.5858189680129, longitude: 127.021344106907 },
          { latitude: 37.5858189680129, longitude: 127.021344106907 },
        ],
      },
      {
        priority: 'DISTANCE',
        duration: 60,
        distance: 5000,
        path: [
          { latitude: 37.5858189680129, longitude: 127.021344106907 },
          { latitude: 37.5858189680129, longitude: 127.021344106907 },
        ],
      },
    ],
    type: [DrivingRouteDetail],
  })
  data: DrivingRouteDetail[];
}

class stopByDurationResponseData {
  @ApiProperty({ example: 'FRONT' })
  strategy: 'FRONT' | 'MIDDLE' | 'REAR';
  @ApiProperty({ example: 60, description: 'in seconds' })
  duration: number;
  @ApiProperty({
    example: [
      { latitude: 37.5858189680129, longitude: 127.021344106907 },
      { latitude: 37.5858189680129, longitude: 127.021344106907 },
    ],
    type: [Coordinate],
  })
  path: Coordinate[];
}

export class GetStopByDurationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({ type: stopByDurationResponseData })
  data: stopByDurationResponseData;
}

class searchOnPathDataDetail {
  @ApiProperty({ example: '호산나교회', required: false })
  place_name?: string;

  @ApiProperty({ example: '부산 강서구 명지오션시티6로 2', required: false })
  road_address_name?: string;

  @ApiProperty({
    example: 'http://place.map.kakao.com/8162856',
    required: false,
  })
  place_url?: string;

  @ApiProperty({ example: '부산 강서구 명지동 3245-5' })
  address_name: string;

  @ApiProperty({ example: '128.907353175642' })
  x: string;

  @ApiProperty({ example: '35.0859058483527' })
  y: string;
}

export class SearchOnPathResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
  @ApiProperty({ type: [searchOnPathDataDetail] })
  data: searchOnPathDataDetail[];
}
