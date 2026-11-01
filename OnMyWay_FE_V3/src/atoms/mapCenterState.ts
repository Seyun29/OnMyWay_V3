import {atom} from '../state/atom';
import {Center} from '../config/types/coordinate';

export const mapCenterState = atom<Center | null>({
  key: 'mapCenterState',
  default: null,
});
