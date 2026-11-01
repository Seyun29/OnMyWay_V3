import {SERVER_BASEURL} from '@env';
//TODO: add api related consts here

// export const BASE_URL = SERVER_BASEURL;
export const BASE_URL =
  'http://<MASKED_ALB_DNS>:8080/';
export const COORD_TO_ADDRESS = '/map/get-address';
export const PLACE_QUERY = '/map/keyword-search';
export const GET_ROUTES = '/map/driving-route';
export const SEARCH_ON_PATH = '/map/search-on-path';
export const GET_STOPBY_DURATION = '/map/stopby-duration';
export const GET_REVIEW_SUMMARY = '/map/get-review-summary';
