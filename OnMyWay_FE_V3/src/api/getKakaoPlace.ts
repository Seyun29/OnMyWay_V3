import {kakaoInstance} from './axios';

export const getKakaoPlace = async (placeId: string) => {
  try {
    const response = await kakaoInstance.get(placeId);
    return response.data;
  } catch {
    return null;
  }
};
