import {kakaoInstance} from './axios';

export const getKakaoPlace = async (placeId: string) => {
  //FIXME: add types
  try {
    const response = await kakaoInstance.get(placeId);
    return response.data;
  } catch (error) {
    console.log('getKakaoPlace error, PlaceId: ', placeId);
  }
};
