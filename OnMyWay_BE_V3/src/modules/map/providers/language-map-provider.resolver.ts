import { Injectable } from '@nestjs/common';
import { GoogleMapAdapter } from './google-map.adapter';
import { KakaoMapAdapter } from './kakao-map.adapter';
import {
  MapProvider,
  MapRequestContext,
  PlaceDetailProvider,
} from './map-provider.port';
import {
  ActiveMapProviderId,
  LanguageProviderFeature,
  MarketConfig,
} from './market-config';

@Injectable()
export class LanguageMapProviderResolver {
  constructor(
    private readonly kakaoAdapter: KakaoMapAdapter,
    private readonly googleAdapter: GoogleMapAdapter,
    private readonly marketConfig: MarketConfig,
  ) {}

  resolve(
    context: MapRequestContext,
    feature: LanguageProviderFeature,
  ): MapProvider {
    return this.resolveMapProvider(
      this.marketConfig.getLanguageProvider(feature, context.language),
    );
  }

  resolvePlaceDetail(): PlaceDetailProvider {
    const provider = this.marketConfig.getPlaceDetailProvider();
    if (provider === 'GOOGLE') return this.googleAdapter;
    throw new Error(`Place detail provider ${provider} is not configured`);
  }

  private resolveMapProvider(provider: ActiveMapProviderId): MapProvider {
    return provider === 'KAKAO' ? this.kakaoAdapter : this.googleAdapter;
  }
}
