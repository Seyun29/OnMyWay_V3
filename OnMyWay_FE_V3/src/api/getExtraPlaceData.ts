import {getKakaoPlace} from './getKakaoPlace';
import {parseKakaoPlaceExtraData} from './parseKakaoPlaceExtraData';

export const getExtraPlaceData = async (placeId: string) => {
  try {
    const res = await getKakaoPlace(placeId);
    return parseKakaoPlaceExtraData(res);
  } catch {
    return {};
  }
};
