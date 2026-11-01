import {GET_PLACE_DETAIL} from '../config/consts/api';
import {
  MapProviderId,
  PlaceDetailFieldStatus,
  ProviderAttribution,
} from '../config/types/coordinate';
import {axiosInstance, isStaleLanguageError} from './axios';

// null은 UNKNOWN을 뜻한다. 확인되지 않은 값을 false로 표시하지 않는다.
export interface PlaceDetailData {
  provider: MapProviderId;
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

export const getPlaceDetail = async (
  id: string,
): Promise<PlaceDetailData | null> => {
  try {
    const response = await axiosInstance.get(GET_PLACE_DETAIL, {
      params: {id},
    });
    return response.data.data ?? null;
  } catch (error) {
    if (isStaleLanguageError(error)) return null;
    // 상세 보강 실패는 기본 정보 표시를 막지 않는다.
    return null;
  }
};
