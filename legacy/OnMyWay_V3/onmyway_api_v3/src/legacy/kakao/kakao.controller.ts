import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { KakaoService } from './kakao.service';
import {
  KakaoKeywordSearchQuery,
  KakaoDrivingPathQuery,
  KakaoGetAddressQuery,
} from 'src/apis/types/kakaoApiTypes';
import {
  GetStopByDurationQuery,
  SearchOnPathQuery,
} from 'src/legacy/omwApiTypes';
import { SuccessInterceptor } from 'src/common/interceptors/success.interceptor';
import { HttpExceptionFilter } from 'src/common/exceptions/http-exception-filter/http-exception-filter.filter';
import { ApiTags } from '@nestjs/swagger';

@Controller('kakao')
@UseInterceptors(SuccessInterceptor)
@UseFilters(HttpExceptionFilter)
@ApiTags('Kakao(Temp)')
export class KakaoController {
  constructor(private readonly kakaoService: KakaoService) {}

  private readonly logger = new Logger(KakaoController.name);

  @Get('get-address')
  //returns list of candidate addresss (string value) with input coordinates (make sure coord system has to be converted)
  //TODO: pipes can be added here, for validation
  async getAddress(@Query() params: KakaoGetAddressQuery) {
    this.logger.log(`getAddress: ${params}`);
    return await this.kakaoService.getAddress(params);
  }

  @Get('keyword-search')
  //returns list of place informations with input query, coordinates?, and raadius?
  //TODO: pipes can be added here, for validation
  async getKeywordSearch(@Query() params: KakaoKeywordSearchQuery) {
    this.logger.log(`getKeywordSearch: ${params}`);
    return await this.kakaoService.getKeywordSearch(params);
  }

  @Get('driving-route')
  //returns driving route information with input start and end coordinates (temporarily, no stopover)
  async getDrivingRoute(
    @Query()
    params: KakaoDrivingPathQuery,
  ) {
    this.logger.log(`getDrivingRoute: ${params}`);
    return await this.kakaoService.getDrivingRoute(params);
  }

  @Post('search-on-path')
  //Search query on the path
  //TODO: add type validation (radius,, etc.)
  async getSearchOnPath(@Body() params: SearchOnPathQuery) {
    return await this.kakaoService.searchOnPath(params);
  }

  @Get('stopby-duration')
  async getStopbyDuration(@Query() params: GetStopByDurationQuery) {
    return await this.kakaoService.getStopByDuration(params);
  }
}
