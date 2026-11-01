import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  GOOGLE_GEOCODING_URL,
  GOOGLE_MAPS_SERVER_API_KEY,
  GOOGLE_PLACES_BASE_URL,
  GOOGLE_PLACES_SEARCH_TEXT_URL,
  GOOGLE_ROUTES_COMPUTE_URL,
  ROUTE_PRIORITY_LIST,
} from 'src/config/consts';
import {
  AddressResult,
  GeocodingInput,
  GeocodingProvider,
  MapRequestContext,
  PlaceDetailInput,
  PlaceDetailProvider,
  PlaceDetailResult,
  PlacePhotoInput,
  PlaceResult,
  ProviderFieldStatus,
  PlaceSearchInput,
  PlaceSearchProvider,
  RouteInput,
  RoutePlaceSearchInput,
  RoutePlaceSearchProvider,
  RoutePriority,
  RouteProvider,
  RouteResult,
  StopByRouteInput,
  StopByRouteResult,
} from './map-provider.port';
import { decodePolyline } from './polyline';
import selectVertices from 'src/helpers/selectVertices';
import { RouteNotFoundError } from './route-not-found.error';
import { isSouthKoreanPoint } from './route-region';
import { buildStopByCandidates } from './stop-by-candidates';
import { MapProviderException } from './map-provider.error';

const PLACE_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.googleMapsUri,places.rating,places.userRatingCount,places.currentOpeningHours,places.photos,nextPageToken';
// parkingOptions는 Enterprise + Atmosphere SKU를 유발한다. FieldMask 변경 시 비용 문서를 함께 갱신한다.
const PLACE_DETAIL_FIELD_MASK =
  'id,displayName,formattedAddress,googleMapsUri,rating,userRatingCount,currentOpeningHours,regularOpeningHours,parkingOptions,photos';
const ROUTE_FIELD_MASK =
  'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.routeLabels';
const ENGLISH_CATEGORY_LABELS: Record<string, string> = {
  대형마트: 'supermarket',
  편의점: 'convenience store',
  주차장: 'parking',
  음식점: 'restaurant',
  숙박: 'lodging',
  카페: 'cafe',
  병원: 'hospital',
};
const GOOGLE_INCLUDED_TYPE_BY_CATEGORY: Record<string, string> = {
  MT1: 'supermarket',
  CS2: 'convenience_store',
  PK6: 'parking',
  FD6: 'restaurant',
  AD5: 'lodging',
  CE7: 'cafe',
  HP8: 'hospital',
};
const GOOGLE_PLACES_API_ROOT = GOOGLE_PLACES_BASE_URL.replace(/\/places$/, '');

@Injectable()
export class GoogleMapAdapter
  implements
    GeocodingProvider,
    PlaceSearchProvider,
    RouteProvider,
    RoutePlaceSearchProvider,
    PlaceDetailProvider
{
  async reverseGeocode(
    input: GeocodingInput,
    context: MapRequestContext,
  ): Promise<AddressResult[]> {
    const regionCode = this.toRegionCode(context, [[input.x, input.y]]);
    const data = await this.request(() =>
      axios.get(GOOGLE_GEOCODING_URL, {
        timeout: 6000,
        params: {
          latlng: `${input.y},${input.x}`,
          language: context.language,
          ...(regionCode ? { region: regionCode } : {}),
          key: GOOGLE_MAPS_SERVER_API_KEY,
        },
      }),
    );
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      this.throwGeocodingStatus(data.status);
    }
    const results = data.results ?? [];
    if (results.length === 0) return [];
    const roadAddress = results.find((result) =>
      result.types?.includes('street_address'),
    )?.formatted_address;
    return [
      {
        road_address: roadAddress,
        address: results[0].formatted_address,
      },
    ];
  }

  async searchPlaces(
    input: PlaceSearchInput,
    context: MapRequestContext,
  ): Promise<PlaceResult[]> {
    const regionCode = this.toRegionCode(
      context,
      input.x && input.y ? [[input.x, input.y]] : [],
    );
    const body: Record<string, unknown> = {
      textQuery: this.toTextQuery(input.query, context),
      languageCode: context.language,
      ...(regionCode ? { regionCode } : {}),
      pageSize: Math.min(Number.parseInt(input.size || '15', 10) || 15, 20),
    };
    if (input.x && input.y) {
      body.locationBias = {
        circle: {
          center: {
            latitude: Number.parseFloat(input.y),
            longitude: Number.parseFloat(input.x),
          },
          radius: Math.min(
            Number.parseFloat(input.radius || '20000') || 20000,
            50000,
          ),
        },
      };
    }
    const data = await this.searchText(body);
    return this.toPlaceResults(data);
  }

  async getRoutes(
    input: RouteInput,
    context: MapRequestContext,
  ): Promise<RouteResult[]> {
    const requests = ROUTE_PRIORITY_LIST.map((priority) =>
      this.computeRoute(input, priority, context),
    );
    const results = await Promise.allSettled(requests);
    const successful = results.filter(
      (result): result is PromiseFulfilledResult<RouteResult> =>
        result.status === 'fulfilled',
    );
    if (successful.length > 0) {
      return successful.map((result) => result.value);
    }
    this.throwRouteFailures(results);
  }

  async getStopByRoute(
    input: StopByRouteInput,
    context: MapRequestContext,
  ): Promise<StopByRouteResult> {
    const { stopby, waypoints, priority = 'RECOMMEND', ...routeInput } = input;
    const candidates = buildStopByCandidates(stopby, waypoints);
    if (candidates.length === 0) {
      throw new HttpException('Unsupported waypoint configuration', 400);
    }
    const requests = candidates.map(
      async (candidate): Promise<StopByRouteResult> => {
        const route = await this.computeRoute(
          { ...routeInput, waypoints: candidate.waypoints },
          priority,
          context,
        );
        return {
          duration: route.duration,
          strategy: candidate.strategy,
          path: route.path,
        };
      },
    );
    const results = await Promise.allSettled(requests);
    const successful = results.filter(
      (result): result is PromiseFulfilledResult<StopByRouteResult> =>
        result.status === 'fulfilled',
    );
    if (successful.length === 0) {
      this.throwRouteFailures(results);
    }
    return successful
      .map((result) => result.value)
      .reduce((previous, current) =>
        previous.duration < current.duration ? previous : current,
      );
  }

  async searchAlongRoute(
    input: RoutePlaceSearchInput,
    context: MapRequestContext,
  ): Promise<PlaceResult[]> {
    const vertices = this.selectSearchVertices(input);
    if (vertices.length === 0) return [];

    const maximum = this.getMaximumPlaceCount(input.totalDistance);
    const pageSize = Math.min(
      20,
      Math.max(1, Math.ceil((maximum + 5) / vertices.length)),
    );
    const regionCode = this.toRegionCode(context, vertices);
    const includedType = input.category_group_code
      ? GOOGLE_INCLUDED_TYPE_BY_CATEGORY[input.category_group_code]
      : undefined;
    const textQuery = this.toTextQuery(input.query, context);
    const radius = Math.min(Math.max(input.radius || 20000, 100), 50000);
    const requestForVertex = (vertex: number[]) => ({
      textQuery,
      languageCode: context.language,
      ...(regionCode ? { regionCode } : {}),
      pageSize,
      ...(includedType ? { includedType, strictTypeFiltering: true } : {}),
      locationBias: {
        circle: {
          center: {
            latitude: Number.parseFloat(String(vertex[1])),
            longitude: Number.parseFloat(String(vertex[0])),
          },
          radius,
        },
      },
    });

    type SearchPage = {
      data: Record<string, unknown>;
      body: Record<string, unknown>;
      vertex: number[];
    };
    const initial = await Promise.allSettled(
      vertices.map(async (vertex): Promise<SearchPage> => {
        const body = requestForVertex(vertex);
        return { data: await this.searchText(body), body, vertex };
      }),
    );
    const successful = initial.filter(
      (result): result is PromiseFulfilledResult<SearchPage> =>
        result.status === 'fulfilled',
    );
    const minimumSuccessful = Math.max(1, vertices.length - 2);
    if (successful.length < minimumSuccessful) {
      const failure = initial.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      );
      if (failure) throw failure.reason;
      throw new MapProviderException('MAP_PROVIDER_UNAVAILABLE');
    }

    const places = new Map<string, PlaceResult>();
    const addPage = (page: SearchPage) => {
      this.toPlaceResults(page.data)
        .filter((place) =>
          this.isWithinRadius(place, page.vertex, radius * 1.25),
        )
        .forEach((place) => {
          const key =
            place.provider_place_id ??
            `${place.place_name ?? ''}|${place.address_name}`;
          const existing = places.get(key);
          if (existing) {
            existing.priority = (existing.priority ?? 1) + 1;
          } else {
            places.set(key, { ...place, priority: 1 });
          }
        });
    };

    successful.forEach((result) => addPage(result.value));
    let pending = successful
      .filter((result) => typeof result.value.data.nextPageToken === 'string')
      .map((result) => ({
        ...result.value,
        token: result.value.data.nextPageToken as string,
      }));

    // Google Text Search exposes up to three pages. Fetch more only when the
    // sampled first pages did not already satisfy the route-distance cap.
    for (let page = 1; page < 3 && places.size < maximum; page += 1) {
      if (pending.length === 0) break;
      const settled = await Promise.allSettled(
        pending.map(async (request) => {
          const data = await this.searchText({
            ...request.body,
            pageToken: request.token,
          });
          return { data, body: request.body, vertex: request.vertex };
        }),
      );
      const nextPending: Array<SearchPage & { token: string }> = [];
      settled.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        addPage(result.value);
        if (typeof result.value.data.nextPageToken === 'string') {
          nextPending.push({
            ...result.value,
            token: result.value.data.nextPageToken as string,
          });
        }
      });
      pending = nextPending;
    }

    return Array.from(places.values())
      .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
      .slice(0, maximum);
  }

  private async computeRoute(
    input: RouteInput,
    priority: RoutePriority,
    context: MapRequestContext,
  ): Promise<RouteResult> {
    const body: Record<string, unknown> = {
      origin: this.toRouteWaypoint(input.origin),
      destination: this.toRouteWaypoint(input.destination),
      travelMode: 'DRIVE',
      routingPreference:
        priority === 'RECOMMEND' ? 'TRAFFIC_AWARE' : 'TRAFFIC_AWARE_OPTIMAL',
      languageCode: context.language,
      units: context.units,
      routeModifiers: {
        avoidTolls: input.avoid === 'toll',
        avoidHighways: input.avoid === 'motorway',
      },
    };
    if (input.waypoints) {
      body.intermediates = input.waypoints
        .split(' | ')
        .map((waypoint) => this.toRouteWaypoint(waypoint));
    }
    // Google Routes API는 경유지가 있으면 reference route를 지원하지 않는다.
    if (priority === 'DISTANCE' && !input.waypoints) {
      body.requestedReferenceRoutes = ['SHORTER_DISTANCE'];
    }
    const data = await this.request(() =>
      axios.post(GOOGLE_ROUTES_COMPUTE_URL, body, {
        timeout: 8000,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_SERVER_API_KEY,
          'X-Goog-FieldMask': ROUTE_FIELD_MASK,
        },
      }),
    );
    const routes = data.routes ?? [];
    if (routes.length === 0) {
      throw new RouteNotFoundError();
    }
    const route =
      priority === 'DISTANCE'
        ? (routes.find((candidate) =>
            candidate.routeLabels?.includes('SHORTER_DISTANCE'),
          ) ?? routes[0])
        : routes[0];
    const duration = this.toSeconds(route.duration);
    const distance = route.distanceMeters;
    const encodedPolyline = route.polyline?.encodedPolyline;
    if (
      duration === null ||
      typeof distance !== 'number' ||
      !Number.isFinite(distance) ||
      typeof encodedPolyline !== 'string' ||
      encodedPolyline.length === 0
    ) {
      throw new MapProviderException('MAP_PROVIDER_INVALID_RESPONSE');
    }
    return {
      priority,
      duration,
      distance,
      path: decodePolyline(encodedPolyline),
    };
  }

  private throwRouteFailures(results: PromiseSettledResult<unknown>[]): never {
    const operationalFailure = results.find(
      (result): result is PromiseRejectedResult =>
        result.status === 'rejected' &&
        !(result.reason instanceof RouteNotFoundError),
    );
    if (operationalFailure) {
      if (operationalFailure.reason !== undefined) {
        throw operationalFailure.reason;
      }
      throw new HttpException('Google route request failed', 502);
    }
    throw new RouteNotFoundError();
  }

  private async searchText(body: Record<string, unknown>) {
    return this.request(() =>
      axios.post(GOOGLE_PLACES_SEARCH_TEXT_URL, body, {
        timeout: 8000,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_SERVER_API_KEY,
          'X-Goog-FieldMask': PLACE_FIELD_MASK,
        },
      }),
    );
  }

  async getPlaceDetail(
    input: PlaceDetailInput,
    context: MapRequestContext,
  ): Promise<PlaceDetailResult> {
    const data = await this.request(() =>
      axios.get(`${GOOGLE_PLACES_BASE_URL}/${encodeURIComponent(input.id)}`, {
        timeout: 8000,
        params: { languageCode: context.language },
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_SERVER_API_KEY,
          'X-Goog-FieldMask': PLACE_DETAIL_FIELD_MASK,
        },
      }),
    );
    const openingHours = data.currentOpeningHours ?? data.regularOpeningHours;
    const open =
      typeof data.currentOpeningHours?.openNow === 'boolean'
        ? data.currentOpeningHours.openNow
        : null;
    const openingHourDescriptions = Array.isArray(
      openingHours?.weekdayDescriptions,
    )
      ? openingHours.weekdayDescriptions
      : null;
    const parking = this.toParking(data.parkingOptions);
    const rating =
      typeof data.rating === 'number' && Number.isFinite(data.rating)
        ? data.rating
        : null;
    const ratingCount =
      typeof data.userRatingCount === 'number' &&
      Number.isFinite(data.userRatingCount)
        ? data.userRatingCount
        : null;
    return {
      provider: 'GOOGLE',
      attribution: { provider: 'GOOGLE', url: data.googleMapsUri },
      field_status: {
        open: this.toFieldStatus(open),
        opening_hours: this.toFieldStatus(openingHourDescriptions),
        parking: this.toFieldStatus(parking),
        rating: this.toFieldStatus(rating),
        rating_count: this.toFieldStatus(ratingCount),
        photo: this.toFieldStatus(data.photos?.[0]?.name),
      },
      id: data.id ?? input.id,
      place_name: data.displayName?.text,
      address_name: data.formattedAddress,
      place_url: data.googleMapsUri,
      open,
      opening_hours: openingHourDescriptions,
      parking,
      rating,
      rating_count: ratingCount,
      photo_reference: data.photos?.[0]?.name,
    };
  }

  async getPlacePhotoUri(input: PlacePhotoInput): Promise<string> {
    if (!/^places\/[^/]+\/photos\/[^/]+$/.test(input.name)) {
      throw new MapProviderException('MAP_PROVIDER_INVALID_RESPONSE');
    }
    const data = await this.request(() =>
      axios.get(`${GOOGLE_PLACES_API_ROOT}/${input.name}/media`, {
        timeout: 8000,
        params: {
          maxWidthPx: 800,
          skipHttpRedirect: true,
          key: GOOGLE_MAPS_SERVER_API_KEY,
        },
      }),
    );
    if (typeof data.photoUri !== 'string' || data.photoUri.length === 0) {
      throw new MapProviderException('MAP_PROVIDER_INVALID_RESPONSE');
    }
    return data.photoUri;
  }

  private selectSearchVertices(input: RoutePlaceSearchInput): number[][] {
    const validPath = input.path.filter(
      (point) =>
        point.length >= 2 &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1])),
    );
    if (validPath.length <= 1) return validPath;

    const selected = selectVertices({
      path: validPath,
      totalDistance: input.totalDistance,
      radius: input.radius || 20000,
    });
    const unique = Array.from(
      new Map(
        selected.map((point) => [`${point[0]},${point[1]}`, point]),
      ).values(),
    );
    if (unique.length <= 10) return unique;
    return Array.from(
      { length: 10 },
      (_, index) => unique[Math.round((index * (unique.length - 1)) / 9)],
    );
  }

  private getMaximumPlaceCount(totalDistance: number): number {
    if (totalDistance <= 70000) {
      return Math.min(70, Math.max(Math.ceil(totalDistance / 1000), 30));
    }
    if (totalDistance <= 150000) return 100;
    if (totalDistance <= 200000) return 120;
    return 150;
  }

  private isWithinRadius(
    place: PlaceResult,
    vertex: number[],
    radius: number,
  ): boolean {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitude = Number(vertex[1]);
    const longitude = Number(vertex[0]);
    const latitudeDelta = toRadians(place.y - latitude);
    const longitudeDelta = toRadians(place.x - longitude);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(toRadians(latitude)) *
        Math.cos(toRadians(place.y)) *
        Math.sin(longitudeDelta / 2) ** 2;
    const clamped = Math.min(1, Math.max(0, a));
    return (
      6371000 * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped)) <=
      radius
    );
  }

  // region은 필터가 아닌 bias/표기 힌트다. 좌표가 있으면 한국 geofence로 KR을 유도하고,
  // 좌표가 없으면 언어 기반 fallback(context.regionCode)을 사용한다. 해외 좌표는 미지정.
  private toRegionCode(
    context: MapRequestContext,
    lngLatPairs: Array<readonly (string | number)[]>,
  ): string | undefined {
    if (lngLatPairs.length === 0) return context.regionCode;
    const touchesKorea = lngLatPairs.some(([x, y]) =>
      isSouthKoreanPoint(
        Number.parseFloat(String(x)),
        Number.parseFloat(String(y)),
      ),
    );
    return touchesKorea ? 'KR' : undefined;
  }

  // parkingOptions가 없으면 UNKNOWN(null). 존재하면 어느 한 형태라도 제공될 때 true.
  private toParking(parkingOptions?: Record<string, boolean>): boolean | null {
    if (!parkingOptions) return null;
    return Object.values(parkingOptions).some((value) => value === true);
  }

  private toFieldStatus(value: unknown): ProviderFieldStatus {
    return value === null || value === undefined ? 'UNKNOWN' : 'KNOWN';
  }

  private toPlaceResults(data): PlaceResult[] {
    const places = Array.isArray(data.places) ? data.places : [];
    return places.flatMap((place): PlaceResult[] => {
      const longitude = place.location?.longitude;
      const latitude = place.location?.latitude;
      if (
        typeof longitude !== 'number' ||
        !Number.isFinite(longitude) ||
        typeof latitude !== 'number' ||
        !Number.isFinite(latitude)
      ) {
        return [];
      }
      return [
        {
          provider: 'GOOGLE',
          provider_place_id: place.id,
          attribution: { provider: 'GOOGLE', url: place.googleMapsUri },
          place_name: place.displayName?.text,
          address_name:
            place.shortFormattedAddress ?? place.formattedAddress ?? '',
          road_address_name: place.formattedAddress,
          place_url: place.googleMapsUri,
          place_id: place.id,
          photo_reference: place.photos?.[0]?.name,
          open:
            typeof place.currentOpeningHours?.openNow === 'boolean'
              ? place.currentOpeningHours.openNow
              : undefined,
          commentCnt:
            typeof place.userRatingCount === 'number'
              ? place.userRatingCount
              : undefined,
          scoreAvg: typeof place.rating === 'number' ? place.rating : undefined,
          x: longitude,
          y: latitude,
          is_end: !data.nextPageToken,
          total_count: places.length,
        },
      ];
    });
  }

  // 기존 category magic query를 Google 검색 언어에 맞는 자유 텍스트로 변환한다.
  private toTextQuery(query: string, context: MapRequestContext): string {
    if (!query.startsWith('카테고리 :')) return query;
    const label = query.split(' : ')[1]?.trim() || query;
    return context.language === 'en'
      ? (ENGLISH_CATEGORY_LABELS[label] ?? label)
      : label;
  }

  private toRouteWaypoint(lngLat: string) {
    const [longitude, latitude] = lngLat
      .split(',')
      .map((value) => Number.parseFloat(value.trim()));
    return { location: { latLng: { latitude, longitude } } };
  }

  private throwGeocodingStatus(status?: string): never {
    if (status === 'OVER_QUERY_LIMIT') {
      throw new MapProviderException(
        'MAP_PROVIDER_QUOTA_EXCEEDED',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (status === 'REQUEST_DENIED') {
      throw new MapProviderException('MAP_PROVIDER_AUTHENTICATION_FAILED');
    }
    throw new MapProviderException('MAP_PROVIDER_UNAVAILABLE');
  }

  private toSeconds(duration?: string): number | null {
    if (typeof duration !== 'string' || !duration.endsWith('s')) return null;
    const seconds = Number.parseFloat(duration.slice(0, -1));
    return Number.isFinite(seconds) ? Math.round(seconds) : null;
  }

  private async request(execute: () => Promise<{ data }>) {
    try {
      const response = await execute();
      return response.data;
    } catch (error: unknown) {
      if (!axios.isAxiosError(error)) {
        throw new MapProviderException('MAP_PROVIDER_UNAVAILABLE');
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new MapProviderException(
          'MAP_PROVIDER_TIMEOUT',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      const status = error.response?.status;
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        throw new MapProviderException(
          'MAP_PROVIDER_QUOTA_EXCEEDED',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      if (
        status === HttpStatus.UNAUTHORIZED ||
        status === HttpStatus.FORBIDDEN
      ) {
        throw new MapProviderException('MAP_PROVIDER_AUTHENTICATION_FAILED');
      }
      if (
        status === HttpStatus.BAD_REQUEST ||
        status === HttpStatus.UNPROCESSABLE_ENTITY
      ) {
        throw new MapProviderException('MAP_PROVIDER_INVALID_RESPONSE');
      }
      throw new MapProviderException('MAP_PROVIDER_UNAVAILABLE');
    }
  }
}
