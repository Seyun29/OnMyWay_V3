import { HttpException, HttpStatus } from '@nestjs/common';

export type MapProviderErrorCode =
  | 'MAP_PROVIDER_QUOTA_EXCEEDED'
  | 'MAP_PROVIDER_AUTHENTICATION_FAILED'
  | 'MAP_PROVIDER_TIMEOUT'
  | 'MAP_PROVIDER_UNAVAILABLE'
  | 'MAP_PROVIDER_INVALID_RESPONSE';

const ERROR_MESSAGES: Record<MapProviderErrorCode, string> = {
  MAP_PROVIDER_QUOTA_EXCEEDED: 'Map provider quota exceeded',
  MAP_PROVIDER_AUTHENTICATION_FAILED: 'Map provider authentication failed',
  MAP_PROVIDER_TIMEOUT: 'Map provider did not respond in time',
  MAP_PROVIDER_UNAVAILABLE: 'Map provider is unavailable',
  MAP_PROVIDER_INVALID_RESPONSE: 'Map provider returned an invalid response',
};

export class MapProviderException extends HttpException {
  constructor(
    code: MapProviderErrorCode,
    status: HttpStatus = HttpStatus.BAD_GATEWAY,
  ) {
    super(
      {
        statusCode: status,
        error: code,
        message: ERROR_MESSAGES[code],
      },
      status,
    );
  }
}
