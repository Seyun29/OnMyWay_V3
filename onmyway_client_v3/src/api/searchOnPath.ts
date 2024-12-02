import {SEARCH_ON_PATH} from '../config/consts/api';
import {axiosInstance} from './axios';

export const searchOnPath = async (params: any) => {
  try {
    const response = await axiosInstance.post(SEARCH_ON_PATH, params);
    return response.data.data;
  } catch (error) {
    console.log('searchOnPath error');
    return null;
  }
};
