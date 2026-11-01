import { Injectable } from '@nestjs/common';
import { MapRequestContext } from './map-provider.port';
import { MarketConfig } from './market-config';

@Injectable()
export class ProviderContext {
  constructor(private readonly marketConfig: MarketConfig) {}

  create(acceptLanguage?: string): MapRequestContext {
    const requestedLanguage = (acceptLanguage ?? '')
      .split(',')[0]
      .trim()
      .toLowerCase();
    const language = requestedLanguage.startsWith('ko')
      ? 'ko'
      : this.marketConfig.defaultLanguage;

    return {
      language,
      regionCode: this.marketConfig.getRegionCode(language),
      units: this.marketConfig.getUnits(),
    };
  }
}
