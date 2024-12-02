import { config } from 'dotenv';

config();

export const OPENAI_HEADER_AUTH = process.env.OPENAI_HEADER_AUTH;
export const OPENAI_BASE_URL = 'https://api.openai.com/v1/';
export const OPENAI_API_URL = 'chat/completions';

export const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

export const KAKAO_MAP_BASE_URL = 'https://dapi.kakao.com/v2/local/';
export const KAKAO_NAV_BASE_URL = 'https://apis-navi.kakaomobility.com/v1/';

export const KAKAO_GET_ADDRESS_URL = 'geo/coord2address.JSON';
export const KAKAO_GET_DRIVING_ROUTE_URL = 'directions';
export const KAKAO_ADDRESS_SEARCH_URL = 'search/address.JSON';
export const KAKAO_KEYWORD_SEARCH_URL = 'search/keyword.JSON';
export const KAKAO_CATEGORY_SEARCH_URL = 'search/category.JSON';

export const ROUTE_PRIORITY_LIST: Array<'RECOMMEND' | 'TIME' | 'DISTANCE'> = [
  'RECOMMEND',
  'DISTANCE',
  'TIME',
];

//MT1=대형마트 / CS2=편의점 / PS3=어린이집, 유치원 / SC4=학교 / AC5=학원 / PK6=주차장 / OL7=주유소, 충전소 / SW8=지하철역 / BK9=은행 / CT1=문화시설 / AG2=중개업소 / PO3=공공기관 / AT4=관광명소 / AD5=숙박 / FD6=음식점 / CE7=카페 / HP8=병원 / PM9=약국
export const CATEGORY_LIST = [
  'MT1',
  'CS2',
  'PS3',
  'SC4',
  'AC5',
  'PK6',
  'OL7',
  'SW8',
  'BK9',
  'CT1',
  'AG2',
  'PO3',
  'AT4',
  'AD5',
  'FD6',
  'CE7',
  'HP8',
  'PM9',
];
//FIXME: fix it to be enum or literals

export const CATEGORY_LABEL_TO_CODE = {
  대형마트: 'MT1',
  편의점: 'CS2',
  주차장: 'PK6',
  음식점: 'FD6',
  숙박: 'AD5',
  카페: 'CE7',
  병원: 'HP8',
};

export const MAX_RESULT = 70;
