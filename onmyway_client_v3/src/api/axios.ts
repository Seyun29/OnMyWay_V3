import axios, {AxiosError} from 'axios';
import {BASE_URL} from '../config/consts/api';
import {get} from '../config/helpers/storage';
// import {Alert} from 'react-native';

export const axiosDefault = axios.create({
  baseURL: BASE_URL,
  // baseURL: 'http://localhost:8080',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosDefault.interceptors.response.use(
  response => {
    return response;
  },
  async (error: AxiosError) => {
    onError(error, error?.config?.url);
    return Promise.reject(error);
  },
);

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(async (config: any) => {
  const accessToken = await get('accessToken');
  // console.log("axiosPrivate interceptor request:", config.headers);
  if (accessToken)
    config.headers = {...config.headers, accessToken: accessToken};
  // console.log("axiosPrivate interceptor, request header:", config.headers);
  return config;
});

axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  async (error: AxiosError) => {
    //FIXME: uncomment if needed
    // Alert.alert(
    //   '오류',
    //   '서버와의 통신에 문제가 발생했습니다. 다시 시도해주세요.',
    // );
    onError(error, error?.config?.url);
    return Promise.reject(error);
  },
);

export const kakaoInstance = axios.create({
  baseURL: 'https://place.map.kakao.com/main/v/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

kakaoInstance.interceptors.response.use(
  response => {
    return response;
  },
  async (error: AxiosError) => {
    onError(error, error?.config?.url);
    return Promise.reject(error);
  },
);

const onError = (err: AxiosError, apiUrl: string | undefined) => {
  if (err.response) {
    console.log(
      apiUrl,
      ': ',
      '요청이 이루어 졌으나 서버가 2xx의 범위를 벗어나는 상태 코드로 응답했습니다.',
      // err.message,
    );
  } else if (err.request) {
    console.log(
      apiUrl,
      ': ',
      '요청이 이루어 졌으나 응답을 받지 못했습니다.',
      err.request._response,
    );
  } else {
    console.log(
      apiUrl,
      ': ',
      '오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.',
      err.message,
    );
  }
};
