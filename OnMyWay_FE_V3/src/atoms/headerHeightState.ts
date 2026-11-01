import {atom} from '../state/atom';
import {ROUGH_HEADER_HEIGHT} from '../config/consts/style';

export const headerHeightState = atom({
  key: 'headerHeightState',
  default: ROUGH_HEADER_HEIGHT,
});
