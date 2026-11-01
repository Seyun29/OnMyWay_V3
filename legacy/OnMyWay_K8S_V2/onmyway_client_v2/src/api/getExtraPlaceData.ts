import {getKakaoPlace} from './getKakaoPlace';

export const getExtraPlaceData = async (placeId: string) => {
  try {
    const res = await getKakaoPlace(placeId);
    let scoreAvg;
    if (
      res.comment?.scorecnt &&
      res.comment?.scorecnt !== 0 &&
      res.comment?.scoresum
    ) {
      const scorecnt = res.comment?.scorecnt;
      const scoresum = res.comment?.scoresum;
      scoreAvg = ((scoresum / (scorecnt * 5)) * 5).toFixed(1);
    }
    return {
      open: res.basicInfo?.openHour?.realtime?.open,
      tags: res.basicInfo?.tags,
      photoUrl: res.photo?.photoList[0].list[0].orgurl
        ? res.photo?.photoList[0].list[0].orgurl.replace(
            /^http:\/\//i,
            'https://',
          )
        : null,
      commentCnt: res.comment?.kamapComntcnt,
      reviewCnt: res.blogReview?.blogrvwcnt,
      parking: res.basicInfo?.facilityInfo?.parking,
      scoreAvg,
    };
  } catch (error) {
    console.error(error);
    return {};
  }
};
