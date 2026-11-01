import {PlaceDetail} from '../types/coordinate';

const numericScore = (place: PlaceDetail): number =>
  Number(place.scoreAvg ?? 0);
const reviewCount = (place: PlaceDetail): number => place.commentCnt ?? 0;

export const filterByOpen = (result: PlaceDetail[]): PlaceDetail[] =>
  result.filter(item => item.open);

export const filterByParking = (result: PlaceDetail[]): PlaceDetail[] =>
  result.filter(item => item.parking);

export const sortByScore = (result: PlaceDetail[]): PlaceDetail[] =>
  [...result].sort((a, b) => {
    const scoreDifference = numericScore(b) - numericScore(a);
    return scoreDifference !== 0
      ? scoreDifference
      : reviewCount(b) - reviewCount(a);
  });

export const sortByReview = (result: PlaceDetail[]): PlaceDetail[] =>
  [...result].sort((a, b) => {
    const countDifference = reviewCount(b) - reviewCount(a);
    return countDifference !== 0
      ? countDifference
      : numericScore(b) - numericScore(a);
  });
