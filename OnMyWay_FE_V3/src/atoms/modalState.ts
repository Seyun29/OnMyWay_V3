import {atom} from '../state/atom';

export const modalState = atom<boolean>({
  key: 'modalState',
  default: false,
});
