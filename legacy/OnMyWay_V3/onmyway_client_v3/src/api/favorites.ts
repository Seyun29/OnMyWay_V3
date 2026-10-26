import {axiosInstance} from './axios';

export const getFavorites = async (params: {username: string}) => {
  //FIXME: add types
  try {
    const response = await axiosInstance.get('/user/favorites', {
      params: {
        username: params.username,
      },
    });
    return response.data;
  } catch (error) {
    console.log('getFavorites error, Params: ', params);
  }
};

// {
//   "username": "seyun",
//   "placeName": "placenmae",
//   "roadAddressName": "roadAddress",
//   "addressName": "address",
//   "coordinate": {
//       "latitude": "latitude",
//       "longitude": "longitude"
//   }

export const addFavorite = async (params: {
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
    const response = await axiosInstance.post('/user/favorite', params);
    return response.data;
  } catch (error) {
    console.log('addFavorite error, Params: ', params);
  }
};
