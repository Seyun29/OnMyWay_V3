import {ExtraDetail} from '../config/types/coordinate';

const parseOpenStatus = (data: any): boolean | undefined => {
  const code =
    data?.open_hours?.headline?.code ??
    data?.business_hours?.real_time_info?.business_hours_status?.code;

  if (code === 'OPEN') return true;
  if (code === 'CLOSED' || code === 'CLOSE') return false;
  return undefined;
};

export const parseKakaoPlaceExtraData = (data: any): ExtraDetail => {
  if (!data) return {};

  const open = parseOpenStatus(data);
  const photo = data.photos?.photos?.[0]?.url;
  return {
    ...(open !== undefined ? {open} : {}),
    tags: data.place_add_info?.tags,
    photoUrl: photo ? photo.replace(/^http:\/\//i, 'https://') : null,
    commentCnt: data.kakaomap_review?.score_set?.review_count,
    reviewCnt: data.blog_review?.review_count,
    parking: data.place_add_info?.facilities?.is_parking,
    scoreAvg: data.kakaomap_review?.score_set?.average_score,
  };
};
