import {atom} from '../state/atom';

export const listModalState = atom<boolean>({
  key: 'listModalState',
  default: false,
});
