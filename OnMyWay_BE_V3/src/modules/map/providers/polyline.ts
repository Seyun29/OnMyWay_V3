import { Coordinate } from './map-provider.port';

const PRECISION = 1e5;

const encodeValue = (value: number, output: string[]) => {
  let encoded = value < 0 ? ~(value << 1) : value << 1;
  while (encoded >= 0x20) {
    output.push(String.fromCharCode((0x20 | (encoded & 0x1f)) + 63));
    encoded >>= 5;
  }
  output.push(String.fromCharCode(encoded + 63));
};

export const encodePolyline = (path: Coordinate[]): string => {
  const output: string[] = [];
  let previousLatitude = 0;
  let previousLongitude = 0;
  path.forEach(({ latitude, longitude }) => {
    const roundedLatitude = Math.round(latitude * PRECISION);
    const roundedLongitude = Math.round(longitude * PRECISION);
    encodeValue(roundedLatitude - previousLatitude, output);
    encodeValue(roundedLongitude - previousLongitude, output);
    previousLatitude = roundedLatitude;
    previousLongitude = roundedLongitude;
  });
  return output.join('');
};

export const decodePolyline = (encoded: string): Coordinate[] => {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const readValue = (): number => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    latitude += readValue();
    longitude += readValue();
    coordinates.push({
      latitude: latitude / PRECISION,
      longitude: longitude / PRECISION,
    });
  }
  return coordinates;
};
