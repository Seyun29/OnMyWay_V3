export interface Coordinate {
  latitude: number; //y
  longitude: number; //x
}

export type MapProviderId = 'GOOGLE' | 'KAKAO' | 'TMAP' | 'NAVER';
export type ProviderFieldStatus = 'KNOWN' | 'UNKNOWN' | 'UNSUPPORTED';
export interface ProviderAttribution {
  provider: MapProviderId;
  url?: string;
}
export interface PlaceDetailFieldStatus {
  open: ProviderFieldStatus;
  opening_hours: ProviderFieldStatus;
  parking: ProviderFieldStatus;
  rating: ProviderFieldStatus;
  rating_count: ProviderFieldStatus;
  photo?: ProviderFieldStatus;
}

export interface CoordDetail extends Coordinate {
  isOpen?: boolean;
  isClosed?: boolean; //else, if will be 'default' marker
  category?: string;
}

export interface ExtraDetail {
  open?: boolean;
  tags?: string[];
  photoUrl?: string | null;
  commentCnt?: number; //별점
  reviewCnt?: number;
  scoreAvg?: string | number;
  parking?: boolean;
}

export interface PlaceDetail extends ExtraDetail {
  provider?: MapProviderId;
  provider_place_id?: string;
  attribution?: ProviderAttribution;
  field_status?: PlaceDetailFieldStatus;
  coordinate: Coordinate;
  place_name: string;
  place_url: string;
  // provider place resource id. 현재 Google 검색 결과에만 존재한다.
  place_id?: string;
  // Google photo resource name. The API key stays on the backend.
  photo_reference?: string;
  address_name: string;
  road_address_name?: string;
  x: number;
  y: number;
  max_length?: number;
  stopByDuration?: number;
  originalDuration?: number;
}

export interface OmWMarkerProps {
  resultList: PlaceDetail[];
}

export interface Center extends Coordinate {
  zoom: number;
}
