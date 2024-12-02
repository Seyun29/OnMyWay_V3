import {atom} from 'recoil';

export const selectedPlaceIndexState = atom<number>({
  key: 'selectedPlaceIndexState',
  default: -1,
});
