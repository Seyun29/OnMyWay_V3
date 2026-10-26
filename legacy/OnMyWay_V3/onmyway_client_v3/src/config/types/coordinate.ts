export interface Coordinate {
  latitude: number; //y
  longitude: number; //x
}

export interface CoordDetail extends Coordinate {
  //FIXME: add other properties here
  isOpen?: boolean;
  isClosed?: boolean; //else, if will be 'default' marker
  category?: string; //FIXME: add enum for category
}

export interface ExtraDetail {
  open?: string;
  tags?: string[];
  photoUrl?: string;
  commentCnt?: number; //별점
  reviewCnt?: number;
  scoreAvg?: string;
  parking?: string; //'Y' | 'N' | undefined
}

export interface PlaceDetail extends ExtraDetail {
  coordinate: Coordinate;
  place_name: string;
  place_url: string;
  address_name: string;
  road_address_name?: string;
  x: '128.907353175642';
  y: '35.0859058483527';
  max_length?: number;
  stopByDuration?: number;
  originalDuration?: number;
}

export interface OmWMarkerProps {
  //TODO: add more props here
  resultList: PlaceDetail[];
}

export interface Center extends Coordinate {
  zoom: number;
}
