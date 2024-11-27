import {atom} from 'recoil';
import {ANAM} from '../dummy/coord';
import {Center} from '../config/types/coordinate';

export const mapCenterState = atom<Center>({
  key: 'mapCenterState',
  default: {...ANAM, zoom: 14},
});
