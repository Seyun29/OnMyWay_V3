import {ANAM, BOMUN, BUSAN, GANGNEUNG} from './coord';

export const ANAM_DETAIL = {
  ...ANAM,
  isOpen: true,
  // category: 'restaurant',
};

export const BOMUN_DETAIL = {
  ...BOMUN,
  isOpen: false,
  // category: 'restaurant',
};

export const GANGNEUNG_DETAIL = {
  ...GANGNEUNG,
  isOpen: true,
  // category: 'restaurant',
};

export const BUSAN_DETAIL = {
  ...BUSAN,
  isOpen: false,
  // category: 'restaurant',
};

export const DUMMY_COORD_DETAILS = [
  ANAM_DETAIL,
  BOMUN_DETAIL,
  GANGNEUNG_DETAIL,
  BUSAN_DETAIL,
];
