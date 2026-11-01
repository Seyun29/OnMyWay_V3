import {useRecoilValue} from '../state/atom';
import {languageState} from '../atoms/languageState';
import {translate, TranslationKey, TranslationValues} from '../config/language';

export const useTranslation = () => {
  const language = useRecoilValue(languageState);

  return {
    language,
    t: (key: TranslationKey, values?: TranslationValues) =>
      translate(language, key, values),
  };
};
