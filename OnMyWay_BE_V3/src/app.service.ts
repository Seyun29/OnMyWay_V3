import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to OnMyWay Dev Api Server!';
  }
  getHealth(): string {
    return 'ok';
  }
}
