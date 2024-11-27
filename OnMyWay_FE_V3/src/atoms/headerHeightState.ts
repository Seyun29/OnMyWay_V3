import {atom} from 'recoil';
import {ROUGH_HEADER_HEIGHT} from '../config/consts/style';

export const headerHeightState = atom({
  key: 'headerHeightState',
  default: ROUGH_HEADER_HEIGHT,
});
