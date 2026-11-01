//@ts-nocheck
import axios from 'axios';
import {LLM_MODEL_NAME, LOCAL_LLM_URL} from '../config/consts/api';
import {GET_REVIEW_SUMMARY} from '../config/consts/api';
import {axiosInstance} from './axios';

export const getKakaoReviews = async (placeId: string) => {
  try {
    let reviews = '';
    let hasNext = false;
    let nextCommentId = '';
    let reviewCnt = 0;
    const response = await axios.get(
      'https://place.map.kakao.com/main/v/' + placeId,
    );
    if (response.data && response.data.comment && response.data.comment.list) {
      hasNext = response.data.comment.hasNext;
      response.data.comment.list.map(rev => {
        reviews += rev.contents + '\n';
        reviewCnt++;
      });
      nextCommentId =
        response.data.comment.list[response.data.comment.list.length - 1]
          .commentid;
    }
    while (hasNext) {
      hasNext = false;
      const res = await axios.get(
        'https://place.map.kakao.com/commentlist/v/' +
          placeId +
          '/' +
          nextCommentId,
      );
      if (res.data && res.data.comment && res.data.comment.list) {
        hasNext = res.data.comment?.hasNext;
        res.data.comment?.list.map(rev => {
          if (rev.contents && rev.contents.length > 0) {
            reviews += rev.contents + '\n';
            reviewCnt++;
            if (reviewCnt > 20) hasNext = false;
          }
        });
        nextCommentId =
          res.data.comment?.list[res.data.comment.list.length - 1].commentid;
      }
    }
    if (reviewCnt < 7) throw new Error('리뷰 개수가 너무 적습니다.');
    const cleanedReviews = reviews.replace(/[\r\n]+/g, ' ');
    return cleanedReviews;
  } catch (error) {
    console.error(error);
  }
};

//FIXME: add type here
export const getReviewSummary = async (placeId: string) => {
  try {
    const reviews = await getKakaoReviews(placeId); //reviews from kakao
    const body = {corpus: reviews.replace('\n', '')};
    //below is the api using chatGPT 3.5 Turbo
    const response = await axiosInstance.post(GET_REVIEW_SUMMARY, body);
    return response.data.data;

    //TODO: uncomment this after setting up the local llm server
    // const postData = {
    //   model: LLM_MODEL_NAME,
    //   prompt: '다음 리뷰들을 총 400자 미만으로 요약해줘. : "' + reviews + '"',
    //   stream: false,
    // };
    // const response = await axios.post(
    //   `http://${LOCAL_LLM_URL}:11434/api/generate`,
    //   postData,
    // );
    // const cleanedReviews = response.data.response.replace(/[\r\n]+/g, ' ');
    // return cleanedReviews;
  } catch (error) {
    console.error('getReviewSummary error');
    console.error(error);
    return null;
  }
};
