export default interface SelectVerticesParams {
  path: string[][];
  totalDistance: number;
  radius: number;
}

export interface Coordinate {
  latitude: number; //위도, y, ex) 37.5858189680129
  longitude: number; //경도, x, ex) 127.021344106907
}
