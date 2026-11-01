import {BASE_URL, GET_PLACE_PHOTO} from '../config/consts/api';

export const getPlacePhotoUrl = (photoReference?: string): string | null =>
  photoReference
    ? `${BASE_URL}${GET_PLACE_PHOTO}?name=${encodeURIComponent(photoReference)}`
    : null;
