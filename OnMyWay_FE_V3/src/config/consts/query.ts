import {TranslationKey} from '../language';

export type CategoryId =
  | 'restaurant'
  | 'cafe'
  | 'convenienceStore'
  | 'supermarket'
  | 'parking'
  | 'lodging'
  | 'hospital';

export type CategoryCode =
  | 'FD6'
  | 'CE7'
  | 'CS2'
  | 'MT1'
  | 'PK6'
  | 'AD5'
  | 'HP8';

export type Category = {
  id: CategoryId;
  code: CategoryCode;
  labelKey: TranslationKey;
  queryKey: TranslationKey;
};

export type PlaceSearchQuery =
  | {kind: 'keyword'; value: string}
  | {kind: 'category'; categoryId: CategoryId};

export const CATEGORY_LIST: readonly Category[] = [
  {
    id: 'restaurant',
    code: 'FD6',
    labelKey: 'category.restaurant',
    queryKey: 'category.query.restaurant',
  },
  {
    id: 'cafe',
    code: 'CE7',
    labelKey: 'category.cafe',
    queryKey: 'category.query.cafe',
  },
  {
    id: 'convenienceStore',
    code: 'CS2',
    labelKey: 'category.convenienceStore',
    queryKey: 'category.query.convenienceStore',
  },
  {
    id: 'supermarket',
    code: 'MT1',
    labelKey: 'category.supermarket',
    queryKey: 'category.query.supermarket',
  },
  {
    id: 'parking',
    code: 'PK6',
    labelKey: 'category.parking',
    queryKey: 'category.query.parking',
  },
  {
    id: 'lodging',
    code: 'AD5',
    labelKey: 'category.lodging',
    queryKey: 'category.query.lodging',
  },
  {
    id: 'hospital',
    code: 'HP8',
    labelKey: 'category.hospital',
    queryKey: 'category.query.hospital',
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORY_LIST.map(category => [category.id, category]),
) as Record<CategoryId, Category>;
