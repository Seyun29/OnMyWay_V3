import {buffer} from '@turf/buffer';
import {lineString} from '@turf/helpers';
import {Coordinate} from '../types/coordinate';

const BUFFER_STEPS = 8;
const MAX_ROUTE_POINTS = 500;

const sampleRoute = (path: Coordinate[]): Coordinate[] => {
  if (path.length <= MAX_ROUTE_POINTS) return path;

  const interval = (path.length - 1) / (MAX_ROUTE_POINTS - 1);
  return Array.from(
    {length: MAX_ROUTE_POINTS},
    (_, index) => path[Math.round(index * interval)],
  );
};

const isValidCoordinate = ({latitude, longitude}: Coordinate) =>
  Number.isFinite(latitude) && Number.isFinite(longitude);

export interface RouteBufferPolygon {
  outer: Coordinate[];
  holes: Coordinate[][];
}

const toCoordinates = (ring: number[][]): Coordinate[] =>
  ring.map(([longitude, latitude]) => ({longitude, latitude}));

export const createRouteBufferPolygons = (
  path: Coordinate[],
  radiusKm: number,
): RouteBufferPolygon[] => {
  if (
    path.length < 2 ||
    !Number.isFinite(radiusKm) ||
    radiusKm <= 0 ||
    !path.every(isValidCoordinate)
  ) {
    return [];
  }

  try {
    const route = lineString(
      sampleRoute(path).map(({longitude, latitude}) => [longitude, latitude]),
    );
    const buffered = buffer(route, radiusKm, {
      units: 'kilometers',
      steps: BUFFER_STEPS,
    });
    if (!buffered) return [];

    const polygons =
      buffered.geometry.type === 'Polygon'
        ? [buffered.geometry.coordinates]
        : buffered.geometry.coordinates;

    return polygons
      .map(([outer, ...holes]) => ({
        outer: toCoordinates(outer),
        holes: holes.map(toCoordinates).filter(hole => hole.length >= 4),
      }))
      .filter(({outer}) => outer.length >= 4);
  } catch {
    return [];
  }
};