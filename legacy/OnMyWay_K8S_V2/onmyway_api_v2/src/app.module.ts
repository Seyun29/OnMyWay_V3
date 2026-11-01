import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { KakaoModule } from './modules/kakao/kakao.module';
import { LoggerMiddleware } from './common/middlewares/logger/logger.middleware';
// import { MongooseModule } from '@nestjs/mongoose';
// import * as mongoose from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { MapModule } from './modules/map/map.module';

//TODO: add malicious attack protection with guard?helmet? with middlewares or interceptors
//TODO: CORS, CSRF, and other security measures
//TODO: add auth token, passport?
//TODO: In general, fine tune parameters for performance (parameters for driving routes, search results, etc.)
@Module({
  imports: [
    ConfigModule.forRoot(),
    // MongooseModule.forRoot(process.env.MONGO_DB_URI), //connect to MongoDB, TODO: utilize DB for logging and user auth, current db name : ~/omw
    // KakaoModule,
    MapModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  private readonly isDev: boolean = process.env.MODE === 'dev' ? true : false;
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    // mongoose.set('debug', this.isDev); //debugging mongoose in development
  }
}
