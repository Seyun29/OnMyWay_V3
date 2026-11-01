import { KAKAO_GET_DRIVING_ROUTE_URL } from './../config/consts';
import { axiosKakaoNav, errorHandler } from './axios';
import { KakaoDrivingPathQuery } from './types/kakaoApiTypes';

const kakaoGetDrivingRoute = async (params: KakaoDrivingPathQuery) => {
  try {
    const res = await axiosKakaoNav.get(KAKAO_GET_DRIVING_ROUTE_URL, {
      params,
    });
    return res.data;
  } catch (err) {
    errorHandler(err);
  }
};

export default kakaoGetDrivingRoute;
