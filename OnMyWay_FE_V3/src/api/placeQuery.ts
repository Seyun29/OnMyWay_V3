// @ts-nocheck
import {axiosInstance} from './axios';
import {PLACE_QUERY} from '../config/consts/api';

export const placeQuery = async (query: string) => {
  try {
    const response = await axiosInstance.get(PLACE_QUERY, {
      params: {
        query,
      },
    });
    const ret = response.data?.data.map(x => ({
      place_name: x.place_name,
      address_name: x.address_name,
      road_address_name: x.road_address_name,
      x: typeof x.x === 'string' ? parseFloat(x.x) : x.x,
      y: typeof x.y === 'string' ? parseFloat(x.y) : x.y,
    }));
    return ret;
  } catch (error) {
    console.log('placeQuery error, Params: ', query);
  }
};
