import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  GetAddressRequestDto,
  GetDrivingRouteRequestDto,
  GetKeywordSearchRequestDto,
  GetStopByDurationRequestDto,
  searchOnPathRequestDto,
} from './dto/map.request.dto';
import kakaoGetAddress from 'src/apis/kakaoGetAddress';
import {
  kakaoAddressSearch,
  kakaoCategorySearch,
  kakaoKeywordSearch,
} from 'src/apis/kakaoPlaceSearch';
import kakaoGetDrivingRoute from 'src/apis/kakaoGetDrivingRoute';
import { CATEGORY_LABEL_TO_CODE, ROUTE_PRIORITY_LIST } from 'src/config/consts';
import removeDuplicate from 'src/helpers/removeDuplicate';
import selectVertices from 'src/helpers/selectVertices';
import OpenAI from 'openai';
import openAiGetReviewSummary from 'src/apis/openAiGetReviewSummary';

@Injectable()
export class MapService {
  private logger = new Logger('HTTP');
  async getAddress(params: GetAddressRequestDto) {
    const res = await kakaoGetAddress(params);
    if (res) {
      const data = res.documents.map((doc) => ({
        road_address: doc.road_address?.address_name,
        address: doc.address.address_name,
      }));
      return data;
    }
    return res;
  }

  async getKeywordSearch(params: GetKeywordSearchRequestDto) {
    const documents = [];
    if (!params.x || !params.y) {
      //search on path가 아닌경우
      const addressData = await kakaoAddressSearch(params);
      if (addressData.meta.total_count > 0)
        addressData.documents.forEach((doc) => {
          documents.push({
            // place_name: doc.place_name, //place_name is not in the response
            address_name: doc.address_name,
            road_address_name: doc.road_address?.address_name,
            // place_url: doc.place_url, //place_url is not in the response
            x: parseFloat(doc.x),
            y: parseFloat(doc.y),
          });
        });
    }
    //Category search인 경우
    let keywordData;
    if (params.query.startsWith('카테고리 :')) {
      const category = params.query.split(' : ')[1].trim();
      keywordData = await kakaoCategorySearch({
        category_group_code: CATEGORY_LABEL_TO_CODE[category],
        x: params.x,
        y: params.y,
        radius: params.radius,
        size: params.size,
      });
    } else keywordData = await kakaoKeywordSearch(params);

    keywordData.documents.forEach((data) => {
      documents.push({
        place_name: data.place_name,
        address_name: data.address_name,
        road_address_name: data.road_address_name,
        place_url: data.place_url,
        x: parseFloat(data.x),
        y: parseFloat(data.y),
        is_end: keywordData.meta.is_end, //is_end가 false인 Vertices의 리스트를 유지
        total_count: keywordData.meta.total_count, //totalCount순으로 sort
      });
    });
    return documents;
  }

  async getDrivingRoute(params: GetDrivingRouteRequestDto) {
    const promises = ROUTE_PRIORITY_LIST.map(async (priority) => {
      //FIXME: fix me -> Request Dto has been changed!
      //FIXME: have to return where origin, destination, waypoints are in the original route search API
      const data = await kakaoGetDrivingRoute({ ...params, priority });
      if (data.routes[0].result_code !== 0) {
        throw new HttpException(data.routes[0].result_msg, 400);
      }

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
        if (idx % 2 === 0)
          acc.push({ longitude: cur }); //x값, longitude
        else acc[acc.length - 1].latitude = cur; //y값, latitude
        return acc;
      }, []);

      return { priority, duration, distance, path };
    });

    const results = await Promise.allSettled(promises);
    const successfulResults = results.filter(
      (result) => result.status === 'fulfilled',
    );

    const res = successfulResults.map(
      (result: PromiseFulfilledResult<any>) => result.value,
    );

    return res;
  }

  async getStopByDuration(params: GetStopByDurationRequestDto) {
    //FIXME: exception handling required (when requesting API to Kakao!!! + Error codes)
    // STRATEGY : FRONT / MIDDLE / REAR
    const { stopby, waypoints, ...rest } = params;
    const waypointsList = [];
    if (waypoints) {
      const oldList = waypoints.split(' | ');
      if (oldList.length == 2) {
        waypointsList.push({
          waypoints: `${stopby} | ${oldList[0]} | ${oldList[1]}`,
          strategy: 'FRONT',
        });
        waypointsList.push({
          waypoints: `${oldList[0]} | ${stopby} | ${oldList[1]}`,
          strategy: 'MIDDLE',
        });
        waypointsList.push({
          waypoints: `${oldList[0]} | ${oldList[1]} | ${stopby}`,
          strategy: 'REAR',
        });
      } else if (oldList.length == 1) {
        waypointsList.push({
          waypoints: `${stopby} | ${waypoints}`,
          strategy: 'FRONT',
        });
        waypointsList.push({
          waypoints: `${waypoints} | ${stopby}`,
          strategy: 'REAR',
        });
      }
    } else waypointsList.push({ waypoints: stopby });

    const promise = waypointsList.map(async (waypoint) => {
      const data = await kakaoGetDrivingRoute({
        ...rest,
        waypoints: waypoint.waypoints,
        // summary: true,
        alternatives: false,
      });
      // if (data.routes[0].result_code !== 0) {
      //   throw new HttpException(data.routes[0].result_msg, 400);
      // }
      const route = data.routes[0];
      const path = [];
      route.sections.forEach((section) => {
        const roads = section.roads;
        roads.forEach((road) => {
          path.push(...road.vertexes);
        });
      });

      return {
        duration: data.routes[0].summary.duration,
        strategy: waypoint.strategy,
        path: path.reduce((acc, cur, idx) => {
          if (idx % 2 === 0)
            acc.push({ longitude: cur }); //x값, longitude
          else acc[acc.length - 1].latitude = cur; //y값, latitude
          return acc;
        }, []),
      };
    });
    //request multiple route search API for each waypoint, returns the shortest one (tells the order of waypoints)
    const results = await Promise.allSettled(promise);
    const successfulResults = results.filter(
      (result) => result.status === 'fulfilled',
    );
    if (successfulResults.length === 0)
      throw new HttpException('Error: No route found', 400);
    const candidates = successfulResults.map(
      (result: PromiseFulfilledResult<any>) => result.value,
    );
    const minDurationElement = candidates.reduce((prev, current) => {
      return prev.duration < current.duration ? prev : current;
    });

    return minDurationElement;
  }

  async searchOnPath(params: searchOnPathRequestDto) {
    //FIXME: add validation to Radius!!! (It has to be 0~20000km, and // radius is set so that selectedVertices.length ~<= 10)
    //FIXME: add validation => Min : Math.floor(totalDistance / radius) <= 10, Max : Min(20000, totalDistance) // [ totalDistance / 10, Math.min(20000, totalDistance) ]
    const { query, category_group_code, radius, path, totalDistance } = params;

    const selectedVertices: string[][] = selectVertices({
      path,
      totalDistance,
      radius: radius || 20000,
    });

    // this.logger.log(
    //   'selectedVertices : ' + selectedVertices.length,
    //   Math.ceil(160 / selectedVertices.length),
    // );

    let maximum: number;
    if (totalDistance <= 70000)
      maximum = Math.min(70, Math.max(Math.ceil(totalDistance / 1000), 30));
    else if (totalDistance <= 150000) maximum = 100;
    else if (totalDistance <= 200000) maximum = 120;
    else maximum = 150;

    // radius is set so that selectedVertices.length ~<= 10
    const promises = selectedVertices.map((vertex) =>
      this.getKeywordSearch({
        query: query,
        x: vertex[0],
        y: vertex[1],
        radius: radius.toString(),
        size: Math.min(
          Math.ceil((maximum + 5) / selectedVertices.length),
          15,
        ).toString(), //지점당 검색 결과 개수,, temporary
        category_group_code,
      }),
    );

    const results = await Promise.allSettled(promises);
    const successfulResults = results.filter(
      (result) => result.status === 'fulfilled',
    );

    if (successfulResults.length < promises.length - 2) {
      throw new Error('More than 2 requests failed');
    }
    console.log('maximum + 10 : ', maximum + 10);
    console.log('selectedVertices.length : ', selectedVertices.length);
    console.log(
      'Math.ceil(maximum + 10 / selectedVertices.length) : ',
      Math.ceil((maximum + 10) / selectedVertices.length),
    );
    console.log(
      'unit length : ',
      Math.min(Math.ceil((maximum + 10) / selectedVertices.length), 15),
    );

    const searchResults = [];
    const moreIndexes = [];
    successfulResults.forEach(
      (result: PromiseFulfilledResult<any>, index: number) => {
        if (result.value[0]?.is_end === false)
          moreIndexes.push({ index, total_count: result.value[0].total_count });
        result.value.map((document) => {
          searchResults.push({
            place_name: document.place_name,
            address_name: document.address_name,
            road_address_name: document.road_address_name,
            place_url: document.place_url,
            x: parseFloat(document.x),
            y: parseFloat(document.y),
            priority: document.total_count,
          });
        });
      },
    );

    const res = removeDuplicate(searchResults);

    if (res.length < maximum) {
      moreIndexes.sort((a, b) => b.total_count - a.total_count);
      const promises = moreIndexes.map((moreIndex) =>
        this.getKeywordSearch({
          query: query,
          x: selectedVertices[moreIndex.index][0],
          y: selectedVertices[moreIndex.index][1],
          radius: radius.toString(),
          size: Math.min(
            Math.ceil((maximum - res.length) / moreIndexes.length),
            15,
          ).toString(),
          category_group_code,
        }),
      );
      const results = await Promise.allSettled(promises);
      const successfulResults = results.filter(
        (result) => result.status === 'fulfilled',
      );
      successfulResults.forEach((result: PromiseFulfilledResult<any>) => {
        result.value.map((document) => {
          if (res.length <= maximum)
            res.push({
              place_name: document.place_name,
              address_name: document.address_name,
              road_address_name: document.road_address_name,
              place_url: document.place_url,
              x: parseFloat(document.x),
              y: parseFloat(document.y),
              priority: document.total_count,
            });
        });
      });
    }

    const retRes = removeDuplicate(res);

    retRes.sort((a, b) => b.priority - a.priority);

    // this.logger.log(
    //   'initial result length :' +
    //     res.length +
    //     'final result length :' +
    //     retRes.length,
    // );

    return retRes;
  }

  //FIXME: complete feature, add types
  async getReviewSummary(params) {
    const res = await openAiGetReviewSummary(params);

    if (res && res.choices && res.choices.length > 0) {
      return res.choices[0].message?.content;
    } else {
      //throw error here
      throw new HttpException('Error while generating summary', 500);
    }
  }
}
