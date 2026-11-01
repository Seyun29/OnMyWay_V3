import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    //interceptor logic here
    // console.log('intercept');
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
