import { Injectable } from '@nestjs/common';
import {
  GetAddressRequestDto,
  GetDrivingRouteRequestDto,
  GetKeywordSearchRequestDto,
  GetPlaceDetailRequestDto,
  GetPlacePhotoRequestDto,
  GetStopByDurationRequestDto,
  searchOnPathRequestDto,
} from './dto/map.request.dto';
import { MapRequestContext } from './providers/map-provider.port';
import { CalculateDetourUseCase } from './use-cases/calculate-detour.use-case';
import { FindRoutesUseCase } from './use-cases/find-routes.use-case';
import { GetAddressUseCase } from './use-cases/get-address.use-case';
import { GetPlaceDetailsUseCase } from './use-cases/get-place-details.use-case';
import { SearchPlacesAlongRouteUseCase } from './use-cases/search-places-along-route.use-case';
import { SearchPlacesUseCase } from './use-cases/search-places.use-case';

@Injectable()
export class MapService {
  constructor(
    private readonly getAddressUseCase: GetAddressUseCase,
    private readonly searchPlacesUseCase: SearchPlacesUseCase,
    private readonly findRoutesUseCase: FindRoutesUseCase,
    private readonly searchPlacesAlongRouteUseCase: SearchPlacesAlongRouteUseCase,
    private readonly getPlaceDetailsUseCase: GetPlaceDetailsUseCase,
    private readonly calculateDetourUseCase: CalculateDetourUseCase,
  ) {}

  getAddress(params: GetAddressRequestDto, context: MapRequestContext) {
    return this.getAddressUseCase.execute(params, context);
  }

  getKeywordSearch(
    params: GetKeywordSearchRequestDto,
    context: MapRequestContext,
  ) {
    return this.searchPlacesUseCase.execute(params, context);
  }

  getDrivingRoute(
    params: GetDrivingRouteRequestDto,
    context: MapRequestContext,
  ) {
    return this.findRoutesUseCase.execute(params, context);
  }

  getStopByDuration(
    params: GetStopByDurationRequestDto,
    context: MapRequestContext,
  ) {
    return this.calculateDetourUseCase.execute(params, context);
  }

  searchOnPath(params: searchOnPathRequestDto, context: MapRequestContext) {
    return this.searchPlacesAlongRouteUseCase.execute(params, context);
  }

  getPlaceDetail(params: GetPlaceDetailRequestDto, context: MapRequestContext) {
    return this.getPlaceDetailsUseCase.execute(params, context);
  }

  getPlacePhotoUri(params: GetPlacePhotoRequestDto) {
    return this.getPlaceDetailsUseCase.getPhotoUri(params);
  }
}
