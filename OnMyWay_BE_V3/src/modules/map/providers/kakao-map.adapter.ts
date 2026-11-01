import { HttpException, Injectable } from '@nestjs/common';
import kakaoGetAddress from 'src/apis/kakaoGetAddress';
import kakaoGetDrivingRoute from 'src/apis/kakaoGetDrivingRoute';
import {
  kakaoAddressSearch,
  kakaoCategorySearch,
  kakaoKeywordSearch,
} from 'src/apis/kakaoPlaceSearch';
import { CATEGORY_LABEL_TO_CODE, ROUTE_PRIORITY_LIST } from 'src/config/consts';
import removeDuplicate from 'src/helpers/removeDuplicate';
import selectVertices from 'src/helpers/selectVertices';
import { buildStopByCandidates } from './stop-by-candidates';
import {
  AddressResult,
  Coordinate,
  GeocodingInput,
  GeocodingProvider,
  PlaceResult,
  PlaceSearchInput,
  PlaceSearchProvider,
  RouteInput,
  RoutePlaceSearchInput,
  RoutePlaceSearchProvider,
  RouteProvider,
  RouteResult,
  StopByRouteInput,
  StopByRouteResult,
} from './map-provider.port';

@Injectable()
export class KakaoMapAdapter
  implements
    GeocodingProvider,
    PlaceSearchProvider,
    RouteProvider,
    RoutePlaceSearchProvider
{
  async reverseGeocode(input: GeocodingInput): Promise<AddressResult[]> {
    const response = await kakaoGetAddress(input);
    return response.documents.map((document) => ({
      road_address: document.road_address?.address_name,
      address: document.address.address_name,
    }));
  }

  async searchPlaces(input: PlaceSearchInput): Promise<PlaceResult[]> {
    const documents: PlaceResult[] = [];
    if (!input.x || !input.y) {
      const addressData = await kakaoAddressSearch(input);
      if (addressData.meta.total_count > 0) {
        addressData.documents.forEach((document) => {
          documents.push({
            provider: 'KAKAO',
            attribution: { provider: 'KAKAO' },
            address_name: document.address_name,
            road_address_name: document.road_address?.address_name,
            x: Number.parseFloat(document.x),
            y: Number.parseFloat(document.y),
          });
        });
      }
    }

    const keywordData = input.query.startsWith('카테고리 :')
      ? await kakaoCategorySearch({
          category_group_code:
            CATEGORY_LABEL_TO_CODE[input.query.split(' : ')[1].trim()],
          x: input.x,
          y: input.y,
          radius: input.radius,
          size: input.size,
        })
      : await kakaoKeywordSearch(input);

    keywordData.documents.forEach((document) => {
      documents.push({
        provider: 'KAKAO',
        provider_place_id: document.id,
        attribution: { provider: 'KAKAO', url: document.place_url },
        place_name: document.place_name,
        address_name: document.address_name,
        road_address_name: document.road_address_name,
        place_url: document.place_url,
        x: Number.parseFloat(document.x),
        y: Number.parseFloat(document.y),
        is_end: keywordData.meta.is_end,
        total_count: keywordData.meta.total_count,
      });
    });
    return documents;
  }

  async getRoutes(input: RouteInput): Promise<RouteResult[]> {
    const requests = ROUTE_PRIORITY_LIST.map(async (priority) => {
      const data = await kakaoGetDrivingRoute({
        ...input,
        priority,
        alternatives: false,
      });
      const route = data?.routes?.[0];
      if (!route) {
        throw new HttpException(
          'Kakao route response did not include a route',
          502,
        );
      }
      if (route.result_code !== 0) {
        throw new HttpException(
          route.result_msg || 'Kakao route not found',
          400,
        );
      }
      return {
        priority,
        duration: route.summary.duration,
        distance: route.summary.distance,
        path: this.toCoordinates(route),
      };
    });
    const results = await Promise.allSettled(requests);
    const successful = results.filter(
      (result): result is PromiseFulfilledResult<RouteResult> =>
        result.status === 'fulfilled',
    );
    if (successful.length > 0) {
      return successful.map((result) => result.value);
    }
    this.throwRouteFailures(results, 'Kakao did not return a route');
  }

  async getStopByRoute(input: StopByRouteInput): Promise<StopByRouteResult> {
    const { stopby, waypoints, priority = 'RECOMMEND', ...routeInput } = input;
    const candidates = buildStopByCandidates(stopby, waypoints);
    if (candidates.length === 0) {
      throw new HttpException('Unsupported waypoint configuration', 400);
    }
    const requests = candidates.map(
      async (candidate): Promise<StopByRouteResult> => {
        const data = await kakaoGetDrivingRoute({
          ...routeInput,
          waypoints: candidate.waypoints,
          priority,
          alternatives: false,
        });
        const route = data?.routes?.[0];
        if (!route) {
          throw new HttpException(
            'Kakao route response did not include a route',
            502,
          );
        }
        if (route.result_code !== 0) {
          throw new HttpException(
            route.result_msg || 'Kakao route not found',
            400,
          );
        }
        return {
          duration: route.summary.duration,
          strategy: candidate.strategy,
          path: this.toCoordinates(route),
        };
      },
    );

    const results = await Promise.allSettled(requests);
    const successful = results.filter(
      (result): result is PromiseFulfilledResult<StopByRouteResult> =>
        result.status === 'fulfilled',
    );
    if (successful.length === 0) {
      this.throwRouteFailures(results, 'Kakao did not return a stop-by route');
    }
    return successful
      .map((result) => result.value)
      .reduce((previous, current) =>
        previous.duration < current.duration ? previous : current,
      );
  }

  async searchAlongRoute(input: RoutePlaceSearchInput): Promise<PlaceResult[]> {
    const { query, category_group_code, radius, path, totalDistance } = input;
    const selectedVertices = selectVertices({
      path,
      totalDistance,
      radius: radius || 20000,
    });
    const maximum = this.getMaximumPlaceCount(totalDistance);
    const requests = selectedVertices.map((vertex) =>
      this.searchPlaces({
        query,
        x: vertex[0].toString(),
        y: vertex[1].toString(),
        radius: radius.toString(),
        size: Math.min(
          Math.ceil((maximum + 5) / selectedVertices.length),
          15,
        ).toString(),
        category_group_code,
      }),
    );
    const settled = await Promise.allSettled(requests);
    const successful = settled.filter(
      (result): result is PromiseFulfilledResult<PlaceResult[]> =>
        result.status === 'fulfilled',
    );
    if (successful.length < requests.length - 2) {
      throw new Error('More than 2 requests failed');
    }

    const searchResults: PlaceResult[] = [];
    const moreIndexes: Array<{ index: number; total_count: number }> = [];
    successful.forEach((result, index) => {
      if (result.value[0]?.is_end === false) {
        moreIndexes.push({
          index,
          total_count: result.value[0].total_count,
        });
      }
      result.value.forEach((place) => {
        searchResults.push({
          provider: place.provider,
          provider_place_id: place.provider_place_id,
          attribution: place.attribution,
          place_name: place.place_name,
          address_name: place.address_name,
          road_address_name: place.road_address_name,
          place_url: place.place_url,
          x: Number.parseFloat(String(place.x)),
          y: Number.parseFloat(String(place.y)),
          priority: place.total_count,
        });
      });
    });

    const deduplicated = removeDuplicate(searchResults) as PlaceResult[];
    if (deduplicated.length < maximum) {
      moreIndexes.sort((a, b) => b.total_count - a.total_count);
      const additionalRequests = moreIndexes.map((item) =>
        this.searchPlaces({
          query,
          x: selectedVertices[item.index][0].toString(),
          y: selectedVertices[item.index][1].toString(),
          radius: radius.toString(),
          size: Math.min(
            Math.ceil((maximum - deduplicated.length) / moreIndexes.length),
            15,
          ).toString(),
          category_group_code,
        }),
      );
      const additionalResults = await Promise.allSettled(additionalRequests);
      additionalResults.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        result.value.forEach((place) => {
          if (deduplicated.length <= maximum) {
            deduplicated.push({
              provider: place.provider,
              provider_place_id: place.provider_place_id,
              attribution: place.attribution,
              place_name: place.place_name,
              address_name: place.address_name,
              road_address_name: place.road_address_name,
              place_url: place.place_url,
              x: Number.parseFloat(String(place.x)),
              y: Number.parseFloat(String(place.y)),
              priority: place.total_count,
            });
          }
        });
      });
    }

    const result = removeDuplicate(deduplicated) as PlaceResult[];
    result.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return result;
  }

  private throwRouteFailures(
    results: PromiseSettledResult<unknown>[],
    message: string,
  ): never {
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (failure?.reason instanceof Error) {
      throw failure.reason;
    }
    throw new HttpException(message, 502);
  }

  private toCoordinates(route): Coordinate[] {
    const vertices: number[] = [];
    route.sections.forEach((section) => {
      section.roads.forEach((road) => vertices.push(...road.vertexes));
    });
    return vertices.reduce<Coordinate[]>((coordinates, value, index) => {
      if (index % 2 === 0) {
        coordinates.push({ longitude: value, latitude: 0 });
      } else {
        coordinates[coordinates.length - 1].latitude = value;
      }
      return coordinates;
    }, []);
  }

  private getMaximumPlaceCount(totalDistance: number): number {
    if (totalDistance <= 70000) {
      return Math.min(70, Math.max(Math.ceil(totalDistance / 1000), 30));
    }
    return totalDistance <= 200000 ? 120 : 150;
  }
}
