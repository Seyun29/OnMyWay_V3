import { Injectable } from '@nestjs/common';
import {
  MapRequestContext,
  StopByRouteInput,
} from '../providers/map-provider.port';
import { RouteMapProviderResolver } from '../providers/route-map-provider.resolver';

@Injectable()
export class CalculateDetourUseCase {
  constructor(private readonly providerResolver: RouteMapProviderResolver) {}

  execute(input: StopByRouteInput, context: MapRequestContext) {
    return this.providerResolver.getStopByRoute(input, context);
  }
}
