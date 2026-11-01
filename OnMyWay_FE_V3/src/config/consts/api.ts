import {Platform} from 'react-native';
import {SERVER_BASEURL, SERVER_PORT} from '@env';

const DEFAULT_LOCAL_PORT = '3005';
const localHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const localPort = SERVER_PORT?.trim() || DEFAULT_LOCAL_PORT;
const localBaseUrl = `http://${localHost}:${localPort}`;
const configuredBaseUrl = SERVER_BASEURL?.trim().replace(/\/+$/, '');

if (configuredBaseUrl && !/^https?:\/\//i.test(configuredBaseUrl)) {
  throw new Error('SERVER_BASEURL must start with http:// or https://.');
}

if (!configuredBaseUrl && !__DEV__) {
  throw new Error('SERVER_BASEURL is required for production builds.');
}

// 개발은 플랫폼별 localhost와 3005를 사용한다. Production은 SERVER_BASEURL의
// http/https scheme을 그대로 사용하며 기본 포트(80/443)는 URL client가 결정한다.
export const BASE_URL = configuredBaseUrl || localBaseUrl;

export const COORD_TO_ADDRESS = '/map/get-address';
export const PLACE_QUERY = '/map/keyword-search';
export const GET_ROUTES = '/map/driving-route';
export const SEARCH_ON_PATH = '/map/search-on-path';
export const GET_STOPBY_DURATION = '/map/stopby-duration';
export const GET_PLACE_DETAIL = '/map/place-detail';
export const GET_PLACE_PHOTO = '/map/place-photo';
