import {atom} from 'recoil';
import {Navigation} from '../config/types/navigation';

export const navigationState = atom<Navigation>({
  key: 'navigationState',
  default: {
    start: null,
    wayPoints: [],
    end: null,
  },
});
