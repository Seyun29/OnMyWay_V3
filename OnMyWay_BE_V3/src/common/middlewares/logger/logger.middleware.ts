import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.once('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const route = req.route?.path ?? 'unmatched';
      this.logger.log(
        `method=${req.method} route=${route} status=${res.statusCode} durationMs=${durationMs.toFixed(1)}`,
      );
    });

    next();
  }
}
