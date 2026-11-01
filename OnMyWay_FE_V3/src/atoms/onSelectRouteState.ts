import {atom} from '../state/atom';

export const onSelectRouteState = atom<boolean>({
  key: 'onSelectRouteState',
  default: false,
});
