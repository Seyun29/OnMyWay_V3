import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { GoogleMapAdapter } from './providers/google-map.adapter';
import { KakaoMapAdapter } from './providers/kakao-map.adapter';
import { LanguageMapProviderResolver } from './providers/language-map-provider.resolver';
import { MarketConfig } from './providers/market-config';
import { ProviderContext } from './providers/map-request-context';
import { RouteMapProviderResolver } from './providers/route-map-provider.resolver';
import { CalculateDetourUseCase } from './use-cases/calculate-detour.use-case';
import { FindRoutesUseCase } from './use-cases/find-routes.use-case';
import { GetAddressUseCase } from './use-cases/get-address.use-case';
import { GetPlaceDetailsUseCase } from './use-cases/get-place-details.use-case';
import { SearchPlacesAlongRouteUseCase } from './use-cases/search-places-along-route.use-case';
import { SearchPlacesUseCase } from './use-cases/search-places.use-case';

@Module({
  controllers: [MapController],
  providers: [
    MapService,
    GetAddressUseCase,
    SearchPlacesUseCase,
    FindRoutesUseCase,
    SearchPlacesAlongRouteUseCase,
    GetPlaceDetailsUseCase,
    CalculateDetourUseCase,
    KakaoMapAdapter,
    GoogleMapAdapter,
    MarketConfig,
    ProviderContext,
    LanguageMapProviderResolver,
    RouteMapProviderResolver,
  ],
})
export class MapModule {}
