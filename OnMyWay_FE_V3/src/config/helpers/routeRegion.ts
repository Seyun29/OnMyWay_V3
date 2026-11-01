import {Coordinate} from '../types/coordinate';

type LngLat = readonly [longitude: number, latitude: number];

// Routing geofence only. Keep aligned with the backend route-region policy.
const MAINLAND: LngLat[] = [
  [126.1, 38.65], [127.2, 38.3], [128.35, 38.65], [128.63, 38.3],
  [129.1, 37.7], [129.45, 36], [129.35, 35.2], [128.7, 34.7],
  [127.4, 34.2], [126.2, 34.2], [125.7, 35.2], [125.9, 36.5],
];
const ISLAND_BOUNDS = [
  [126.05, 127.05, 33, 33.7],
  [124.4, 125.2, 37.7, 38.3],
  [125.2, 125.9, 34.4, 35.1],
  [130.7, 131, 37.3, 37.7],
  [131.8, 132, 37.1, 37.4],
] as const;

const isInsideMainland = ([x, y]: LngLat): boolean => {
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

export const isSouthKoreanPoint = ({longitude, latitude}: Coordinate) =>
  Number.isFinite(longitude) &&
  Number.isFinite(latitude) &&
  (isInsideMainland([longitude, latitude]) ||
    ISLAND_BOUNDS.some(
      ([minX, maxX, minY, maxY]) =>
        longitude >= minX && longitude <= maxX && latitude >= minY && latitude <= maxY,
    ));

export const routeTouchesSouthKorea = (coordinates: Coordinate[]): boolean =>
  coordinates.some(isSouthKoreanPoint);
