import {atom} from '../state/atom';

export const loadingState = atom<boolean>({
  key: 'loadingState',
  default: false,
});
