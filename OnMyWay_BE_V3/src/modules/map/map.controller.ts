import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { MapService } from './map.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  GetAddressRequestDto,
  GetDrivingRouteRequestDto,
  GetKeywordSearchRequestDto,
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

@Controller('map')
@ApiTags('Main')
export class MapController {
  constructor(private readonly mapService: MapService) {}
  // private readonly logger = new Logger(MapController.name);

  @Get('get-address')
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: GetAddressResponseDto,
  })
  @ApiOperation({ summary: 'Convert coordinate to address(es)' })
  async getAddress(@Query() params: GetAddressRequestDto) {
    return await this.mapService.getAddress(params);
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
  async getKeywordSearch(@Query() params: GetKeywordSearchRequestDto) {
    return await this.mapService.getKeywordSearch(params);
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
    @Query()
    params: GetDrivingRouteRequestDto,
  ) {
    return await this.mapService.getDrivingRoute(params);
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
  async getSearchOnPath(@Body() params: searchOnPathRequestDto) {
    return await this.mapService.searchOnPath(params);
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
  async getStopbyDuration(@Query() params: GetStopByDurationRequestDto) {
    return await this.mapService.getStopByDuration(params);
  }

  //FIXME: create Dtos, add Swagger
  @Post('get-review-summary')
  @ApiResponse({
    status: 200,
    description: 'Success',
    // type: GetAddressResponseDto, //FIXME: Change to GetReviewSummaryResponseDto
  })
  @ApiOperation({ summary: 'Generate Review Summary via ChatGPT' })
  async getReviewSummary(@Body() params: any) {
    //FIXME: Change to GetReviewSummaryRequestDto
    return await this.mapService.getReviewSummary(params);
  }
}
