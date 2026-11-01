import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {BASE_URL} from '../config/consts/api';
import {AppLanguage, getRequestLanguage} from '../config/language';

type LanguageRequestConfig = InternalAxiosRequestConfig & {
  requestLanguage?: AppLanguage;
};

type StaleLanguageError = AxiosError & {
  __CANCEL__: true;
  isStaleLanguageResponse: true;
};

const withLanguageHeader = (config: InternalAxiosRequestConfig) => {
  const language = getRequestLanguage();
  (config as LanguageRequestConfig).requestLanguage = language;
  config.headers.set('Accept-Language', language);
  return config;
};

const rejectStaleLanguageResponse = (response: AxiosResponse) => {
  const requestLanguage = (response.config as LanguageRequestConfig)
    .requestLanguage;
  if (requestLanguage && requestLanguage !== getRequestLanguage()) {
    const error = new AxiosError(
      'Response discarded because the app language changed.',
      AxiosError.ERR_CANCELED,
      response.config,
      response.request,
      response,
    ) as StaleLanguageError;
    error.name = 'CanceledError';
    error.__CANCEL__ = true;
    error.isStaleLanguageResponse = true;
    throw error;
  }
  return response;
};

export const isStaleLanguageError = (
  error: unknown,
): error is StaleLanguageError =>
  axios.isCancel(error) &&
  (error as Partial<StaleLanguageError>).isStaleLanguageResponse === true;

const attachLanguageInterceptors = (client: typeof axiosDefault) => {
  client.interceptors.request.use(withLanguageHeader);
  client.interceptors.response.use(rejectStaleLanguageResponse);
};

export const axiosDefault = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {'Content-Type': 'application/json'},
});

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {'Content-Type': 'application/json'},
});

attachLanguageInterceptors(axiosDefault);
attachLanguageInterceptors(axiosInstance);

const randomUserAgent = () => {
  const userAgentList = [
    'Mozilla/5.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
  ];
  return userAgentList[Math.floor(Math.random() * userAgentList.length)];
};

export const kakaoInstance = axios.create({
  baseURL: 'https://place-api.map.kakao.com/places/panel3/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Referer: 'https://place.map.kakao.com/',
    Origin: 'https://place.map.kakao.com',
    Pf: 'web',
    'Accept-language': 'ko',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'User-Agent': 'Mozilla/5.0',
  },
});

kakaoInstance.interceptors.request.use(config => {
  config.headers['User-Agent'] = randomUserAgent();
  return config;
});
