import { KakaoGetAddressQuery } from 'src/apis/types/kakaoApiTypes';
import { axiosKakaoMap, errorHandler } from './axios';
import { KAKAO_GET_ADDRESS_URL } from 'src/config/consts';

const kakaoGetAddress = async (params: KakaoGetAddressQuery) => {
  try {
    const res = await axiosKakaoMap.get(KAKAO_GET_ADDRESS_URL, {
      params,
    });
    return res.data;
  } catch (err) {
    console.log('Error occured in kakaoGetAddress :', err);
    errorHandler(err);
  }
};

export default kakaoGetAddress;
