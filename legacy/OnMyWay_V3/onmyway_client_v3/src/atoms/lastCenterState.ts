import {atom} from 'recoil';
import {ANAM} from '../dummy/coord';
import {Center} from '../config/types/coordinate';

export const lastCenterState = atom<Center>({
  key: 'lastCenterState',
  default: {...ANAM, zoom: 14},
});
