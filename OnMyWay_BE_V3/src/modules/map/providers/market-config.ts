import { Injectable } from '@nestjs/common';
import {
  MapLanguage,
  MapRequestContext,
  ProviderId,
  RouteInput,
} from './map-provider.port';
import { routeTouchesSouthKorea } from './route-region';

export type LanguageProviderFeature =
  'GEOCODING' | 'PLACE_SEARCH' | 'ROUTE_PLACE_SEARCH';
export type ActiveMapProviderId = Extract<ProviderId, 'GOOGLE' | 'KAKAO'>;

const LANGUAGE_PROVIDER_POLICY: Record<
  LanguageProviderFeature,
  Record<MapLanguage, ActiveMapProviderId>
> = {
  GEOCODING: { ko: 'KAKAO', en: 'GOOGLE' },
  PLACE_SEARCH: { ko: 'KAKAO', en: 'GOOGLE' },
  ROUTE_PLACE_SEARCH: { ko: 'KAKAO', en: 'GOOGLE' },
};

@Injectable()
export class MarketConfig {
  readonly defaultLanguage: MapLanguage = 'en';

  getUnits(): MapRequestContext['units'] {
    return 'METRIC';
  }

  getRegionCode(language: MapLanguage): string | undefined {
    return language === 'ko' ? 'KR' : undefined;
  }

  getLanguageProvider(
    feature: LanguageProviderFeature,
    language: MapLanguage,
  ): ActiveMapProviderId {
    return LANGUAGE_PROVIDER_POLICY[feature][language];
  }

  getRouteProvider(input: RouteInput): ActiveMapProviderId {
    return routeTouchesSouthKorea(input) ? 'KAKAO' : 'GOOGLE';
  }

  getPlaceDetailProvider(): ActiveMapProviderId {
    return 'GOOGLE';
  }
}
