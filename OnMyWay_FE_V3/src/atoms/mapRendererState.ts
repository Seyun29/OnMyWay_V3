import {atom} from '../state/atom';
import {getRequestLanguage} from '../config/language';
import {defaultRendererForLanguage, MapRendererId} from '../config/mapRenderer';

export const mapRendererState = atom<MapRendererId>({
  key: 'MapRendererState',
  default: defaultRendererForLanguage(getRequestLanguage()),
});
