import { KAKAO_GET_DRIVING_ROUTE_URL } from './../config/consts';
import { axiosKakaoNav, errorHandler } from './axios';
import { KakaoDrivingPathQuery } from './types/kakaoApiTypes';

const kakaoGetDrivingRoute = async (params: KakaoDrivingPathQuery) => {
  //waypoints = string of format '{X좌표},{Y좌표}|{x좌표},{y좌표}|...'
  //(e.g. 127.111202,37.394912,name=판교역 | 127.112275,37.392815)
  try {
    const res = await axiosKakaoNav.get(KAKAO_GET_DRIVING_ROUTE_URL, {
      params,
    });
    return res.data;
  } catch (err) {
    console.log('Error occured in kakaoGetDrivingRoute :', err);
    errorHandler(err);
  }
};

export default kakaoGetDrivingRoute;
