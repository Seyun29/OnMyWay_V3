import { Injectable } from '@nestjs/common';
import {
  MapRequestContext,
  PlaceSearchInput,
} from '../providers/map-provider.port';
import { LanguageMapProviderResolver } from '../providers/language-map-provider.resolver';

@Injectable()
export class SearchPlacesUseCase {
  constructor(private readonly providerResolver: LanguageMapProviderResolver) {}

  execute(input: PlaceSearchInput, context: MapRequestContext) {
    return this.providerResolver
      .resolve(context, 'PLACE_SEARCH')
      .searchPlaces(input, context);
  }
}
