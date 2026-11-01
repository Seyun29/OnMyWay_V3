declare module '@env' {
  // 로컬 개발 BE 포트. host는 Platform.OS로 자동 선택된다.
  export const SERVER_PORT: string;
  // 실기기·원격·production 전체 URL. http:// 또는 https://를 포함해야 한다.
  // 로컬 개발에서는 비워두며 production build에서는 필수다.
  export const SERVER_BASEURL: string;
  export const APP_NAME: string;
  export const ANDROID_PACKAGE_NAME: string;
  export const IOS_BUNDLE_ID: string;
  export const GOOGLE_MAPS_ANDROID_API_KEY: string;
  export const GOOGLE_MAPS_IOS_API_KEY: string;
  export const NAVER_MAP_CLIENT_ID: string;
}
