import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl, params, body } = req;
    this.logger.log(
      `Request Info - IP: ${ip}, Header.is_user: ${JSON.stringify(req.headers.is_user)}, Method: ${method}, URL: ${originalUrl}, Params: ${JSON.stringify(params)}, ${body && 'Body (length): ' + JSON.stringify(body).length}`,
    );

    res.on('finish', () => {
      const { statusCode, statusMessage } = res;
      this.logger.log(
        `Response Info - StatusCode: ${statusCode}, StatusMessage: ${statusMessage}`,
      );
    });

    next();
  }
}
