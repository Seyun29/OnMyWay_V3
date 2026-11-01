import {TranslationKey} from '../language';
import {Priority} from '../types/routes';

export const ROUTE_PRIORITY_KEY: Record<Priority, TranslationKey> = {
  RECOMMEND: 'route.recommend',
  TIME: 'route.fastest',
  DISTANCE: 'route.shortest',
};
