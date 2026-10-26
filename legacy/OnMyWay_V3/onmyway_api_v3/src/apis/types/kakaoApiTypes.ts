export interface KakaoKeywordSearchQuery {
  query: string;
  category_group_code?: string; //FIXME: enum , literal type : https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword
  x?: string;
  y?: string;
  radius?: string;
  size?: string;
}

export interface KakaoCategorySearchQuery {
  category_group_code: string;
  x?: string;
  y?: string;
  radius?: string;
  size?: string;
}

export interface KakaoDrivingPathQuery {
  //FIXME: to include other options (using hipass, local roads only,, etc.)
  //FIXME: merge startX,startY and endX,endY
  origin: string; //e.g) "127.111202,37.394912"
  destination: string; //e.g) "127.111202,37.394912"
  waypoints?: string; //waypoints: 경유지 수만큼 "{X좌표},{Y좌표},,name={경유지명}" 또는 "{X좌표},{Y좌표},"를 | 또는 %7C로 연결하여 입력(예:127.111202,37.394912,name=판교역 | 127.112275,37.392815)
  summary?: boolean;
  alternatives?: boolean; //alternative has to be false. (one way to show for one preference of user)
  avoid?: 'toll' | 'motorway'; //toll: 유료 도로, motorway: 자동차 전용 도로
  priority?: 'RECOMMEND' | 'TIME' | 'DISTANCE'; //추천경로, 최단시간, 최단거리
}

export interface KakaoGetAddressQuery {
  x: string;
  y: string;
}
