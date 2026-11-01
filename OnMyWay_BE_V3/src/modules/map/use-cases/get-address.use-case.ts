import { Injectable } from '@nestjs/common';
import {
  GeocodingInput,
  MapRequestContext,
} from '../providers/map-provider.port';
import { LanguageMapProviderResolver } from '../providers/language-map-provider.resolver';

@Injectable()
export class GetAddressUseCase {
  constructor(private readonly providerResolver: LanguageMapProviderResolver) {}

  execute(input: GeocodingInput, context: MapRequestContext) {
    return this.providerResolver
      .resolve(context, 'GEOCODING')
      .reverseGeocode(input, context);
  }
}
