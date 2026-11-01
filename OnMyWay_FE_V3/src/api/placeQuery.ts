import {axiosInstance, isStaleLanguageError} from './axios';
import {PLACE_QUERY} from '../config/consts/api';

type PlaceQueryApiItem = {
  place_name: string;
  address_name: string;
  road_address_name?: string;
  x: string | number;
  y: string | number;
};

export type PlaceQueryResult = {
  place_name: string;
  address_name: string;
  road_address_name?: string;
  x: number;
  y: number;
};

export const placeQuery = async (
  query: string,
): Promise<PlaceQueryResult[] | null> => {
  try {
    const response = await axiosInstance.get(PLACE_QUERY, {params: {query}});
    const places = (response.data?.data ?? []) as PlaceQueryApiItem[];
    return places.map(place => ({
      place_name: place.place_name,
      address_name: place.address_name,
      road_address_name: place.road_address_name,
      x: Number(place.x),
      y: Number(place.y),
    }));
  } catch (error) {
    if (isStaleLanguageError(error)) return null;
    return null;
  }
};
