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
  try {
    const res = await axiosKakaoMap.get(KAKAO_KEYWORD_SEARCH_URL, {
      params,
    });
    return res.data;
  } catch (err) {
    errorHandler(err);
  }
};

export const kakaoCategorySearch = async (params: KakaoCategorySearchQuery) => {
  try {
    const res = await axiosKakaoMap.get(KAKAO_CATEGORY_SEARCH_URL, { params });
    return res.data;
  } catch (err) {
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
    errorHandler(err);
  }
};
