import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { MapService } from './map.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  GetAddressRequestDto,
  GetDrivingRouteRequestDto,
  GetKeywordSearchRequestDto,
  GetPlaceDetailRequestDto,
  GetPlacePhotoRequestDto,
  GetStopByDurationRequestDto,
  searchOnPathRequestDto,
} from './dto/map.request.dto';
import {
  GetAddressResponseDto,
  GetDrivingRouteResponseDto,
  GetKeywordSearchResponseDto,
  GetStopByDurationResponseDto,
  SearchOnPathResponseDto,
} from './dto/map.response.dto';
import { ProviderContext } from './providers/map-request-context';

@Controller('map')
@ApiTags('Main')
export class MapController {
  constructor(
    private readonly mapService: MapService,
    private readonly providerContext: ProviderContext,
  ) {}

  @Get('get-address')
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: GetAddressResponseDto,
  })
  @ApiOperation({ summary: 'Convert coordinate to address(es)' })
  async getAddress(
    @Headers('accept-language') acceptLanguage: string,
    @Query() params: GetAddressRequestDto,
  ) {
    return await this.mapService.getAddress(
      params,
      this.providerContext.create(acceptLanguage),
    );
  }

  @Get('keyword-search')
  @ApiOperation({
    summary:
      'Returns list of place informations with input keyword, address, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: GetKeywordSearchResponseDto,
  })
  async getKeywordSearch(
    @Headers('accept-language') acceptLanguage: string,
    @Query() params: GetKeywordSearchRequestDto,
  ) {
    return await this.mapService.getKeywordSearch(
      params,
      this.providerContext.create(acceptLanguage),
    );
  }

  @Get('driving-route')
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: GetDrivingRouteResponseDto,
  })
  @ApiOperation({
    summary:
      'Returns driving route information list according to input parameters.',
  })
  async getDrivingRoute(
    @Headers('accept-language') acceptLanguage: string,
    @Query() params: GetDrivingRouteRequestDto,
  ) {
    return await this.mapService.getDrivingRoute(
      params,
      this.providerContext.create(acceptLanguage),
    );
  }

  @Post('search-on-path')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Returns list of places on the path of the route.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: SearchOnPathResponseDto,
  })
  async getSearchOnPath(
    @Headers('accept-language') acceptLanguage: string,
    @Body() params: searchOnPathRequestDto,
  ) {
    return await this.mapService.searchOnPath(
      params,
      this.providerContext.create(acceptLanguage),
    );
  }

  @Get('stopby-duration')
  @ApiOperation({
    summary:
      'Returns minimum duration when stopping by a desired place on the route.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: GetStopByDurationResponseDto,
  })
  async getStopbyDuration(
    @Headers('accept-language') acceptLanguage: string,
    @Query() params: GetStopByDurationRequestDto,
  ) {
    return await this.mapService.getStopByDuration(
      params,
      this.providerContext.create(acceptLanguage),
    );
  }

  @Get('place-detail')
  @ApiOperation({
    summary:
      'Returns provider-neutral place details (opening hours, parking, rating). Google place ids only for now.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  async getPlaceDetail(
    @Headers('accept-language') acceptLanguage: string,
    @Query() params: GetPlaceDetailRequestDto,
  ) {
    return await this.mapService.getPlaceDetail(
      params,
      this.providerContext.create(acceptLanguage),
    );
  }

  @Get('place-photo')
  @ApiOperation({ summary: 'Redirects to a Google Places photo.' })
  async getPlacePhoto(
    @Query() params: GetPlacePhotoRequestDto,
    @Res() response: Response,
  ) {
    const photoUri = await this.mapService.getPlacePhotoUri(params);
    response.setHeader('Cache-Control', 'private, max-age=3600');
    return response.redirect(302, photoUri);
  }
}
