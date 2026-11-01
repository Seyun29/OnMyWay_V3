import {atom} from '../state/atom';
import {Center} from '../config/types/coordinate';

export const lastCenterState = atom<Center | null>({
  key: 'lastCenterState',
  default: null,
});
