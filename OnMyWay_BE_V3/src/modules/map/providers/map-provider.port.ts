import type { KakaoCategoryCode } from '../../../config/consts';

export type ProviderId = 'GOOGLE' | 'KAKAO' | 'TMAP' | 'NAVER';
export type ProviderFieldStatus = 'KNOWN' | 'UNKNOWN' | 'UNSUPPORTED';
export type MapLanguage = 'ko' | 'en';
export type RoutePriority = 'RECOMMEND' | 'TIME' | 'DISTANCE';
export type StopByStrategy = 'FRONT' | 'MIDDLE' | 'REAR';

export interface MapRequestContext {
  language: MapLanguage;
  regionCode?: string;
  units: 'METRIC' | 'IMPERIAL';
}
export interface Coordinate {
  latitude: number;
  longitude: number;
}
export interface AddressResult {
  road_address?: string;
  address: string;
}
export interface ProviderAttribution {
  provider: ProviderId;
  url?: string;
}
export interface PlaceResult {
  provider: ProviderId;
  provider_place_id?: string;
  attribution: ProviderAttribution;
  place_name?: string;
  address_name: string;
  road_address_name?: string;
  place_url?: string;
  // provider place resource id. 현재 Google 결과에만 존재하며 place-detail 조회에 사용한다.
  place_id?: string;
  photo_reference?: string;
  open?: boolean;
  commentCnt?: number;
  scoreAvg?: number;
  x: number;
  y: number;
  is_end?: boolean;
  total_count?: number;
  priority?: number;
}
export interface RouteResult {
  priority: RoutePriority;
  duration: number;
  distance: number;
  path: Coordinate[];
}
export interface StopByRouteResult {
  strategy: StopByStrategy;
  duration: number;
  path: Coordinate[];
}

export interface GeocodingInput {
  x: string;
  y: string;
}
export interface PlaceSearchInput {
  query: string;
  category_group_code?: KakaoCategoryCode;
  x?: string;
  y?: string;
  radius?: string;
  size?: string;
}
export interface RouteInput {
  origin: string;
  destination: string;
  waypoints?: string;
  avoid?: 'toll' | 'motorway';
  priority?: RoutePriority;
}
export interface StopByRouteInput extends RouteInput {
  stopby: string;
}
export interface RoutePlaceSearchInput {
  query: string;
  path: number[][];
  totalDistance: number;
  radius: number;
  category_group_code?: KakaoCategoryCode;
}
export interface PlaceDetailInput {
  // provider place resource id. 현재는 Google place id만 발급된다.
  id: string;
}
export interface PlacePhotoInput {
  // Google photo resource name: places/{placeId}/photos/{photoId}
  name: string;
}
// null은 UNKNOWN을 뜻한다. 확인되지 않은 값을 false로 바꾸지 않는다.
export interface PlaceDetailFieldStatus {
  open: ProviderFieldStatus;
  opening_hours: ProviderFieldStatus;
  parking: ProviderFieldStatus;
  rating: ProviderFieldStatus;
  rating_count: ProviderFieldStatus;
  photo: ProviderFieldStatus;
}
export interface PlaceDetailResult {
  provider: ProviderId;
  attribution: ProviderAttribution;
  field_status: PlaceDetailFieldStatus;
  id: string;
  place_name?: string;
  address_name?: string;
  place_url?: string;
  open: boolean | null;
  opening_hours: string[] | null;
  parking: boolean | null;
  rating: number | null;
  rating_count: number | null;
  photo_reference?: string;
}

export interface GeocodingProvider {
  reverseGeocode(
    input: GeocodingInput,
    context: MapRequestContext,
  ): Promise<AddressResult[]>;
}
export interface PlaceSearchProvider {
  searchPlaces(
    input: PlaceSearchInput,
    context: MapRequestContext,
  ): Promise<PlaceResult[]>;
}
export interface RouteProvider {
  getRoutes(
    input: RouteInput,
    context: MapRequestContext,
  ): Promise<RouteResult[]>;
  getStopByRoute(
    input: StopByRouteInput,
    context: MapRequestContext,
  ): Promise<StopByRouteResult>;
}
export interface RoutePlaceSearchProvider {
  searchAlongRoute(
    input: RoutePlaceSearchInput,
    context: MapRequestContext,
  ): Promise<PlaceResult[]>;
}
export interface PlaceDetailProvider {
  getPlaceDetail(
    input: PlaceDetailInput,
    context: MapRequestContext,
  ): Promise<PlaceDetailResult>;
  getPlacePhotoUri(input: PlacePhotoInput): Promise<string>;
}
export type MapProvider = GeocodingProvider &
  PlaceSearchProvider &
  RouteProvider &
  RoutePlaceSearchProvider;
