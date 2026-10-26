import { axiosKakaoMap, errorHandler } from './axios';
import {
  KakaoCategorySearchQuery,
  KakaoKeywordSearchQuery,
} from './types/kakaoApiTypes';
import {
  KAKAO_ADDRESS_SEARCH_URL,
  KAKAO_CATEGORY_SEARCH_URL,
  KAKAO_KEYWORD_SEARCH_URL,
} from '../config/consts';

export const kakaoKeywordSearch = async (params: KakaoKeywordSearchQuery) => {
  //FIXME: seperate logic for purposes
  //1. get coordiates from address
  //2. search for keywords => more optional parameters has to be considered!! (페이지량, 정보량 등...)
  //3. ETC...
  try {
    const res = await axiosKakaoMap.get(KAKAO_KEYWORD_SEARCH_URL, {
      params,
    });
    return res.data;
  } catch (err) {
    console.log('Error occured in kakaoKeywordSearch :', err);
    errorHandler(err);
  }
};

export const kakaoCategorySearch = async (params: KakaoCategorySearchQuery) => {
  try {
    const res = await axiosKakaoMap.get(KAKAO_CATEGORY_SEARCH_URL, { params });
    return res.data;
  } catch (err) {
    console.log('Error occured in kakaoCategorySearch :', err);
    errorHandler(err);
  }
};

export const kakaoAddressSearch = async (params: KakaoKeywordSearchQuery) => {
  try {
    const res = await axiosKakaoMap.get(KAKAO_ADDRESS_SEARCH_URL, {
      params: {
        query: params.query,
      },
    });
    return res.data;
  } catch (err) {
    console.log('Error occured in kakaoAddressSearch :', err);
    errorHandler(err);
  }
};
