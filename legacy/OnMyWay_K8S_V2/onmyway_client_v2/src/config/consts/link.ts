import {Platform} from 'react-native';
import {ANDROID_PACKAGE_NAME, IOS_BUNDLE_ID} from '@env';

export const NMAP_URL_SCHEME_PREFIX = 'nmap://route/car?';
export const NMAP_URL_SCHEME_SUFFIX = `&appname=${
  Platform.OS === 'ios' ? IOS_BUNDLE_ID : ANDROID_PACKAGE_NAME
}`;

export const tmapPlayStoreUrl =
  'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
export const tmapAppStoreUrl =
  'https://apps.apple.com/kr/app/%ED%8B%B0%EB%A7%B5-%EB%8C%80%EC%A4%91%EA%B5%90%ED%86%B5-%EB%8C%80%EB%A6%AC%EC%9A%B4%EC%A0%84-%EC%A3%BC%EC%B0%A8-%EB%A0%8C%ED%84%B0%EC%B9%B4-%EA%B3%B5%ED%95%AD%EB%B2%84%EC%8A%A4/id431589174';
export const TMAP_STORE_URL =
  Platform.OS === 'ios' ? tmapAppStoreUrl : tmapPlayStoreUrl;

export const playStoreUrl = 'market://details?id=com.nhn.android.nmap';
export const appStoreUrl = 'http://itunes.apple.com/app/id311867728?mt=8';
export const STORE_URL = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;

export const OMW_APPSTORE_URL =
  'https://apps.apple.com/us/app/onmyway-%EA%B2%BD%EB%A1%9C-%EC%A3%BC%EB%B3%80-%EC%9E%A5%EC%86%8C-%EA%B2%80%EC%83%89%EC%9D%84-%ED%95%9C%EB%88%88%EC%97%90/id6503656527';
export const OMW_PLAYSTORE_URL =
  'https://play.google.com/store/apps/details?id=com.omw.omw_front';
