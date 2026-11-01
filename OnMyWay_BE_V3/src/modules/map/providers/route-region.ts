import { BadRequestException } from '@nestjs/common';
import { RouteInput, StopByRouteInput } from './map-provider.port';

type LngLat = readonly [longitude: number, latitude: number];

// Routing geofence, not a legal administrative boundary. Includes major
// South Korean road areas plus Jeju, western islands, Ulleungdo, and Dokdo.
const MAINLAND: LngLat[] = [
  [126.1, 38.65],
  [127.2, 38.3],
  [128.35, 38.65],
  [128.63, 38.3],
  [129.1, 37.7],
  [129.45, 36],
  [129.35, 35.2],
  [128.7, 34.7],
  [127.4, 34.2],
  [126.2, 34.2],
  [125.7, 35.2],
  [125.9, 36.5],
];
const ISLAND_BOUNDS = [
  [126.05, 127.05, 33, 33.7],
  [124.4, 125.2, 37.7, 38.3],
  [125.2, 125.9, 34.4, 35.1],
  [130.7, 131, 37.3, 37.7],
  [131.8, 132, 37.1, 37.4],
] as const;

const parseCoordinate = (value: string): LngLat => {
  const [longitude, latitude] = value
    .split(',')
    .slice(0, 2)
    .map((part) => Number.parseFloat(part.trim()));
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new BadRequestException('Invalid route coordinate');
  }
  return [longitude, latitude];
};

const isInsidePolygon = ([x, y]: LngLat): boolean => {
  let inside = false;
  for (let i = 0, j = MAINLAND.length - 1; i < MAINLAND.length; j = i++) {
    const [xi, yi] = MAINLAND[i];
    const [xj, yj] = MAINLAND[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

// routing geofence 재사용: 좌표가 한국이면 true. 잘못된 좌표는 false(판정 불가)로 둔다.
// region bias 힌트 유도용이므로 throw하지 않는다.
export const isSouthKoreanPoint = (
  longitude: number,
  latitude: number,
): boolean => {
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return false;
  }
  return isSouthKoreanCoordinate([longitude, latitude]);
};

const isSouthKoreanCoordinate = (point: LngLat): boolean =>
  isInsidePolygon(point) ||
  ISLAND_BOUNDS.some(
    ([minX, maxX, minY, maxY]) =>
      point[0] >= minX &&
      point[0] <= maxX &&
      point[1] >= minY &&
      point[1] <= maxY,
  );

export const routeTouchesSouthKorea = (
  input: RouteInput | StopByRouteInput,
): boolean => {
  const values = [
    input.origin,
    input.destination,
    ...(input.waypoints?.split('|') ?? []),
  ];
  if ('stopby' in input) values.push(input.stopby);
  return values
    .filter((value) => value.trim())
    .map(parseCoordinate)
    .some(isSouthKoreanCoordinate);
};
