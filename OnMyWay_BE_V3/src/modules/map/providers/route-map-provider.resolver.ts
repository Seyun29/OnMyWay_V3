import { Injectable } from '@nestjs/common';
import { GoogleMapAdapter } from './google-map.adapter';
import { KakaoMapAdapter } from './kakao-map.adapter';
import {
  MapRequestContext,
  RouteInput,
  RouteResult,
  StopByRouteInput,
  StopByRouteResult,
} from './map-provider.port';
import { MarketConfig } from './market-config';

@Injectable()
export class RouteMapProviderResolver {
  constructor(
    private readonly kakaoAdapter: KakaoMapAdapter,
    private readonly googleAdapter: GoogleMapAdapter,
    private readonly marketConfig: MarketConfig,
  ) {}

  getRoutes(
    input: RouteInput,
    context: MapRequestContext,
  ): Promise<RouteResult[]> {
    return this.marketConfig.getRouteProvider(input) === 'KAKAO'
      ? this.kakaoAdapter.getRoutes(input)
      : this.googleAdapter.getRoutes(input, context);
  }

  getStopByRoute(
    input: StopByRouteInput,
    context: MapRequestContext,
  ): Promise<StopByRouteResult> {
    return this.marketConfig.getRouteProvider(input) === 'KAKAO'
      ? this.kakaoAdapter.getStopByRoute(input)
      : this.googleAdapter.getStopByRoute(input, context);
  }
}
