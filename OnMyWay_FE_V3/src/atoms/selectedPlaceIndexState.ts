import {atom} from '../state/atom';

export const selectedPlaceIndexState = atom<number>({
  key: 'selectedPlaceIndexState',
  default: -1,
});
