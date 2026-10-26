import {atom} from 'recoil';
import {PlaceDetail} from '../config/types/coordinate';

export const curPlaceState = atom<PlaceDetail | null>({
  key: 'curPlaceState',
  default: null,
});
