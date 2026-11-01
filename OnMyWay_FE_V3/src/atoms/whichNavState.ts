import {atom} from '../state/atom';
import {WhichNav} from '../config/types/navigation';

export const whichNavState = atom<WhichNav>({
  key: 'whichNavState',
  default: 'start',
});
