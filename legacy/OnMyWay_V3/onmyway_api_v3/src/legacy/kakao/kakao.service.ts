import { Injectable, HttpException } from '@nestjs/common';
import kakaoGetAddress from 'src/apis/kakaoGetAddress';
import kakaoGetDrivingRoute from 'src/apis/kakaoGetDrivingRoute';
import { kakaoKeywordSearch } from 'src/apis/kakaoPlaceSearch';
import {
  KakaoDrivingPathQuery,
  KakaoKeywordSearchQuery,
  KakaoGetAddressQuery,
} from 'src/apis/types/kakaoApiTypes';
import {
  GetDrivingRouteQuery,
  SearchOnPathQuery,
  GetDrivingRouteResult,
} from 'src/legacy/omwApiTypes';
import removeDuplicate from 'src/helpers/removeDuplicate';
import selectVertices from 'src/helpers/selectVertices';

@Injectable()
export class KakaoService {
  async getAddress(params: KakaoGetAddressQuery) {
    const data = await kakaoGetAddress(params);
    return data;
  }

  async getKeywordSearch(params: KakaoKeywordSearchQuery) {
    const data = await kakaoKeywordSearch(params);
    //TODO: add more logics here
    return data;
  }

  async getDrivingRoute(
    params: GetDrivingRouteQuery,
  ): Promise<GetDrivingRouteResult> {
    const data = await kakaoGetDrivingRoute(params);
    if (data.routes[0].result_code !== 0) {
      throw new HttpException(data.routes[0].result_msg, 400);
    }

    const res = { result: { duration: -1, distance: -1, path: [] } };
    const route = data.routes[0];
    const duration = route.summary.duration;
    const distance = route.summary.distance;

    const tmpPath = [];
    route.sections.forEach((section) => {
      const roads = section.roads;
      roads.forEach((road) => {
        tmpPath.push(...road.vertexes);
      });
    });

    const path = tmpPath.reduce((acc, cur, idx) => {
      if (idx % 2 === 0) acc.push([cur]);
      else acc[acc.length - 1].push(cur);
      return acc;
    }, []);

    res.result = { duration, distance, path };

    return res;
  }

  async getStopByDuration(params: KakaoDrivingPathQuery) {
    const data = await kakaoGetDrivingRoute({
      ...params,
      summary: true,
      alternatives: false,
    });
    if (data.routes[0].result_code !== 0) {
      throw new HttpException(data.routes[0].result_msg, 400);
    }
    return data.routes[0].summary.duration;
  }

  async searchOnPath(params: SearchOnPathQuery) {
    const { query, category, radius, path, totalDistance } = params;
    const selectedVertices: string[][] = selectVertices({
      path,
      totalDistance,
      radius,
    });

    const promises = selectedVertices.map((vertex) =>
      this.getKeywordSearch({
        query: query,
        x: vertex[0],
        y: vertex[1],
        radius: radius.toString(),
      }),
    );

    const results = await Promise.allSettled(promises);
    const successfulResults = results.filter(
      (result) => result.status === 'fulfilled',
    );

    if (successfulResults.length < promises.length - 2) {
      throw new Error('More than 2 requests failed');
    }

    const searchResults = [];
    successfulResults.forEach((result: PromiseFulfilledResult<any>) => {
      result.value.documents.map((document) => {
        searchResults.push({
          place_name: document.place_name,
          place_url: document.place_url,
          x: document.x,
          y: document.y,
        });
      });
    });

    const res = removeDuplicate(searchResults);

    return res;
  }
}

// -------- NOTES ---------

// --- GETADDRESS ---
//convert coordinates to address strings

// --- GETKEYWORDSEARCH ---
//TODO: Utilize 'category' parameter, according to confirmed UX flows.
//FIXME: validate query, category, x, y, radius (must exist, string)
//FIXME: result data has to be differently handled according to purpose.
//FIXME: seperate logic for purposes
//1. get coordiates from address
//2. search for keywords => more optional parameters has to be considered!! (페이지량, 정보량 등...)
//3. ETC...

// --- GETDRIVINGROUTES ---
//as of now, Suppose Alternatives = false
//FIXME: UX -> why don't we show multiple possible routes
//input: start, end, waypoints, alternatives, avoid
//output: vertexList = [ [x1, y1], [x2, y2], ... ], totalDistance, totalDuration
//FIXME: utilize 'alternative' -> in case, result data has to be different.
//FIXME: params validation
//TODO: list up exceptions (for client), add exception handling logic

// --- SEARCHONPATH ----
//TODO: add pipe to validate radius and totalDistance, convert to number (not to use parseInt)
//FIXME: default Radius값 필요
//TODO: add error handling Logic

// --- GETSTOPBYDURATION ---
//sets summary = true, alternative = false, returns duration only
//Route Search Failed
//TODO: add exception handling logic

// ---- searchOnPath Logic -----
//1. Server: getDrivingRoute() => returns vertex list, totalDistance and other informations to client
//2. Client: get input KeywordQuery, Desired Category, Radius from user.
//Minimum/Maximum Radius has to be calculated based on totalDistance
//e.g) ( totalDistance / 20 ) <= Radius <= min(200000, max(1000, totalDistance))
//3. Server: searchOnPath(vertexList, totalDistance) -> repeat keywordSearch() for each vertex -> return all results
//If any error occurs during multiple keywordsearchRequests, Flag should be set to show there was ERROR tho.
