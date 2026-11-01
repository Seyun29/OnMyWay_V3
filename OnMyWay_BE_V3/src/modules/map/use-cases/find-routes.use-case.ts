import { Injectable } from '@nestjs/common';
import { MapRequestContext, RouteInput } from '../providers/map-provider.port';
import { RouteMapProviderResolver } from '../providers/route-map-provider.resolver';

@Injectable()
export class FindRoutesUseCase {
  constructor(private readonly providerResolver: RouteMapProviderResolver) {}

  execute(input: RouteInput, context: MapRequestContext) {
    return this.providerResolver.getRoutes(input, context);
  }
}
