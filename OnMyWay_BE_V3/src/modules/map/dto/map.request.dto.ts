import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { CATEGORY_LIST, KakaoCategoryCode } from '../../../config/consts';

export class GetAddressRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '127.021344106907',
    description: 'x coordinate',
    required: true,
  })
  x: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '37.5858189680129',
    description: 'y coordinate',
    required: true,
  })
  y: string;
}

export class GetKeywordSearchRequestDto {
  @IsNotEmpty()
  @ApiProperty({
    example: '안암역, 안암동5가 21, etc...',
    description: 'search keyword, address, etc...',
    required: true,
  })
  query: string;

  @IsOptional()
  @IsIn(CATEGORY_LIST)
  @ApiProperty({
    example: 'MT1',
    description: 'Kakao category group code',
    enum: CATEGORY_LIST,
    required: false,
  })
  category_group_code?: KakaoCategoryCode;

  @ApiProperty({
    example: '127.021344106907',
    description: 'x coordinate',
    required: false,
  })
  x?: string;

  @ApiProperty({
    example: '37.5858189680129',
    description: 'y coordinate',
    required: false,
  })
  y?: string;

  @ApiProperty({
    example: '20000',
    description: 'radius',
    required: false,
  })
  radius?: string;

  @ApiProperty({
    example: '15',
    description: 'number of results in a single page',
    required: false,
  })
  size?: string;
}

export class GetDrivingRouteRequestDto {
  @IsNotEmpty()
  @ApiProperty({
    example: '127.111202,37.394912',
    description: 'origin coordinates in format of "{X좌표},{Y좌표}"',
    required: true,
  })
  origin: string;

  @IsNotEmpty()
  @ApiProperty({
    example: '127.111202,37.394912',
    description: 'destination coordinates in format of "{X좌표},{Y좌표}"',
    required: true,
  })
  destination: string;

  @ApiProperty({
    example: '127.111202,37.394912 | 127.112275,37.392815',
    description: '경유지 수만큼 "{X좌표},{Y좌표}"를 | 또는 %7C로 연결하여 입력',
    required: false,
  })
  waypoints?: string;
  // summary?: boolean;
  // alternatives?: boolean; //alternative has to be true to get multiple routes
  @ApiProperty({
    example: 'toll',
    description: 'toll: 유료 도로 회피, motorway: 자동차 전용 도로 회피',
    required: false,
  })
  avoid?: 'toll' | 'motorway'; //toll: 유료 도로, motorway: 자동차 전용 도로

  @IsOptional()
  @IsIn(['RECOMMEND', 'TIME', 'DISTANCE'])
  @ApiProperty({
    example: 'RECOMMEND',
    description: '선택된 경로 기준. 경유 시간 계산에 사용',
    required: false,
  })
  priority?: 'RECOMMEND' | 'TIME' | 'DISTANCE';
}

export class GetPlaceDetailRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    description:
      'provider place resource id. 현재는 Google 검색 결과의 place_id만 지원',
    required: true,
  })
  id: string;
}

export class GetPlacePhotoRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^places\/[^/]+\/photos\/[^/]+$/)
  @ApiProperty({
    example: 'places/PLACE_ID/photos/PHOTO_ID',
    description: 'Google Places photo resource name',
    required: true,
  })
  name: string;
}

export class GetStopByDurationRequestDto extends GetDrivingRouteRequestDto {
  @IsNotEmpty()
  @ApiProperty({
    example: '127.111202,37.394912',
    description: 'Stopby Place coordinates in format of "{X좌표},{Y좌표}"',
    required: true,
  })
  stopby: string;
}

export class searchOnPathRequestDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'search query on the path',
    example: '사진관',
    required: true,
    type: String,
  })
  query: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'path to search on',
    example: [
      [127.021344106907, 37.5858189680129],
      [127.021344106907, 37.5858189680129],
    ],
    required: true,
    type: 'array',
    items: {
      type: 'array',
      items: { type: 'number' },
    },
  })
  path: number[][];

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'total distance of the path, in meters', //is it in meters?
    example: 5000,
    required: true,
    type: Number,
  })
  totalDistance: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description:
      'in meter, has to be in range of [ totalDistance / 10, Math.min(20000, totalDistance) ]',
    example: 1500,
    required: true,
    type: Number,
  })
  radius: number; //radius has to be given as int, in 'meter' unit

  @IsOptional()
  @IsIn(CATEGORY_LIST)
  @ApiProperty({
    description: 'Kakao category group code',
    example: 'MT1',
    enum: CATEGORY_LIST,
    required: false,
  })
  category_group_code?: KakaoCategoryCode;
}
