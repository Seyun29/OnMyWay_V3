import {atom} from '../state/atom';
import {AppLanguage, getRequestLanguage} from '../config/language';

export const languageState = atom<AppLanguage>({
  key: 'LanguageState',
  default: getRequestLanguage(),
});
