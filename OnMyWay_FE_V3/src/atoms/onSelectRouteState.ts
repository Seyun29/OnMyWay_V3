import {atom} from 'recoil';

export const onSelectRouteState = atom<boolean>({
  key: 'onSelectRouteState',
  default: false,
});
