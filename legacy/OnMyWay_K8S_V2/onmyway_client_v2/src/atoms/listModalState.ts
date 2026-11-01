import {atom} from 'recoil';

export const listModalState = atom<boolean>({
  key: 'listModalState',
  default: false,
});
