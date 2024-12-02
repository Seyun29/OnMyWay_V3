import {atom} from 'recoil';
import {WhichNav} from '../config/types/navigation';

export const whichNavState = atom<WhichNav>({
  key: 'whichNavState',
  default: 'start',
});
