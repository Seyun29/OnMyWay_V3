import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exceptions/http-exception-filter/http-exception-filter.filter';
import { SuccessInterceptor } from './common/interceptors/success.interceptor';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import * as expressBasicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new SuccessInterceptor());
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));
  app.use(
    ['/docs', '/docs-json'],
    expressBasicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD,
      },
    }),
  );
  // app.enableCors({
  //   origin: true,
  //   credentials: true,
  // });
  const config = new DocumentBuilder()
    .setTitle('OnMyWay')
    .setDescription('REST API description for OnMyWay application')
    .setVersion('1.0.0')
    .addTag('Main')
    .addTag('User')
    .build();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const portValue = process.env.PORT?.trim() || '3005';
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid server port: ${portValue}`);
  }

  // 로컬 기본값은 3005다. 배포 환경에서는 Railway 등 플랫폼이 주입한 PORT를 우선한다.
  // 외부 HTTP/HTTPS 종료는 reverse proxy가 담당하고 Nest는 내부 포트에서 수신한다.
  await app.listen(port, '0.0.0.0');
}
bootstrap();
