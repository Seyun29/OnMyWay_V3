import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('Default')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get()
  // @ApiExcludeEndpoint()
  // getHello(): string {
  //   return this.appService.getHello();
  // }

  @Get('/health')
  @ApiOperation({ summary: 'Check server health' })
  getHealth(): string {
    return this.appService.getHealth();
  }
}
