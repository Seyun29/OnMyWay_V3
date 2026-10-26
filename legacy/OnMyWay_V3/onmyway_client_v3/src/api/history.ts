import {axiosInstance} from './axios';

export const getHistory = async (params: {username: string}) => {
  //FIXME: add types
  try {
    const response = await axiosInstance.get('/user/history', {
      params: {
        username: params.username,
      },
    });
    return response.data;
  } catch (error) {
    console.log('getHistory error, Params: ', params);
  }
};

export const addHistory = async (params: {
  username: string;
  placeName: string;
  roadAddressName: string;
  addressName: string;
  coordinate: {
    latitude: string;
    longitude: string;
  };
}) => {
  try {
    const response = await axiosInstance.post('/user/history', params);
    return response.data;
  } catch (error) {
    console.log('addHistory error, Params: ', params);
  }
};
