import { Injectable } from '@nestjs/common';
import {
  MapRequestContext,
  PlaceDetailInput,
  PlacePhotoInput,
} from '../providers/map-provider.port';
import { LanguageMapProviderResolver } from '../providers/language-map-provider.resolver';

@Injectable()
export class GetPlaceDetailsUseCase {
  constructor(private readonly providerResolver: LanguageMapProviderResolver) {}

  execute(input: PlaceDetailInput, context: MapRequestContext) {
    return this.providerResolver
      .resolvePlaceDetail()
      .getPlaceDetail(input, context);
  }

  getPhotoUri(input: PlacePhotoInput) {
    return this.providerResolver.resolvePlaceDetail().getPlacePhotoUri(input);
  }
}
