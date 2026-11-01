import { HttpException } from '@nestjs/common';
import SelectVerticesParams from './types';

//TODO: to improve performance, have to handle different cases according to whether the road is EXPRESSWAY or not. (unit distance becomes  different)
const selectVertices = ({
  path,
  totalDistance,
  radius,
}: SelectVerticesParams) => {
  //decide which vertices to use for keyword search
  // radius is set so that selectedVertices.length ~<= 10
  // skipCount = how many indexes to skip
  // unitDistance * skipCount <= radius
  const totalCount: number = path.length;
  const unitDistance: number = totalDistance / (totalCount - 1); //average distance between two vertices
  const selectedVertices: string[][] = [];

  const skipCount: number = Math.floor(radius / unitDistance);
  if (skipCount === 0)
    throw new HttpException('radius is too small to search on the path', 400);

  let curIdx =
    skipCount / 2 <= totalCount ? Math.floor(skipCount / 2) : totalCount - 1;
  while (curIdx < totalCount) {
    selectedVertices.push(path[curIdx]);
    curIdx += skipCount;
  }
  selectedVertices.push(path[totalCount - 1]);

  return selectedVertices;
};

export default selectVertices;
