import { HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import {
  KAKAO_MAP_BASE_URL,
  KAKAO_NAV_BASE_URL,
  KAKAO_API_KEY,
} from 'src/config/consts';

const axiosKakaoMap = axios.create({
  baseURL: KAKAO_MAP_BASE_URL,
  timeout: 6000,
  headers: { Authorization: KAKAO_API_KEY },
});

const axiosKakaoNav = axios.create({
  baseURL: KAKAO_NAV_BASE_URL,
  timeout: 8000,
  headers: {
    Authorization: KAKAO_API_KEY,
    'Content-Type': 'application/json',
  },
});

const errorHandler = (error: unknown): never => {
  if (!axios.isAxiosError(error)) {
    throw new HttpException(
      'Map provider request failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  const axiosError: AxiosError = error;
  if (axiosError.response) {
    throw new HttpException(
      'Map provider request failed',
      axiosError.response.status,
    );
  }

  if (axiosError.request) {
    throw new HttpException(
      'Map provider did not respond',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  throw new HttpException(
    'Map provider request could not be sent',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
};

export { axiosKakaoMap, axiosKakaoNav, errorHandler };
