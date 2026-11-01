import {AppLanguage} from './language';

// 지도 타일 renderer 선택값. 데이터 provider(Kakao/Google API)와는 독립이다.
export type MapRendererId = 'NAVER' | 'GOOGLE';

export const defaultRendererForLanguage = (
  language: AppLanguage,
): MapRendererId => (language === 'ko' ? 'NAVER' : 'GOOGLE');

export const isMapRendererId = (value: unknown): value is MapRendererId =>
  value === 'NAVER' || value === 'GOOGLE';
