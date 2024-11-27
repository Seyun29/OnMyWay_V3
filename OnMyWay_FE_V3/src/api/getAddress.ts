import {axiosInstance} from './axios';
import {COORD_TO_ADDRESS} from '../config/consts/api';

export const getAddress = async (params: {
  longitude: number;
  latitude: number;
}) => {
  try {
    const response = await axiosInstance.get(COORD_TO_ADDRESS, {
      params: {
        x: params.longitude,
        y: params.latitude,
      },
    });
    return response.data.data[0];
  } catch (error) {
    console.log('getAddress error, Params: ', params);
  }
};
