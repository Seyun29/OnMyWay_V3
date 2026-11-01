import { Injectable } from '@nestjs/common';
import {
  MapRequestContext,
  RoutePlaceSearchInput,
} from '../providers/map-provider.port';
import { LanguageMapProviderResolver } from '../providers/language-map-provider.resolver';

@Injectable()
export class SearchPlacesAlongRouteUseCase {
  constructor(private readonly providerResolver: LanguageMapProviderResolver) {}

  execute(input: RoutePlaceSearchInput, context: MapRequestContext) {
    return this.providerResolver
      .resolve(context, 'ROUTE_PLACE_SEARCH')
      .searchAlongRoute(input, context);
  }
}
