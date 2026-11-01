import Toast from 'react-native-toast-message';
import {useRecoilCallback} from '../state/atom';
import {curPlaceState} from '../atoms/curPlaceState';
import {drawerState} from '../atoms/drawerState';
import {headerHeightState} from '../atoms/headerHeightState';
import {headerRoughState} from '../atoms/headerRoughState';
import {lastCenterState} from '../atoms/lastCenterState';
import {listModalState} from '../atoms/listModalState';
import {loadingState} from '../atoms/loadingState';
import {mapCenterState} from '../atoms/mapCenterState';
import {modalState} from '../atoms/modalState';
import {navigationState} from '../atoms/navigationState';
import {onSelectRouteState} from '../atoms/onSelectRouteState';
import {selectedPlaceIndexState} from '../atoms/selectedPlaceIndexState';
import {whichNavState} from '../atoms/whichNavState';

const transientMapSessionState = [
  navigationState,
  whichNavState,
  onSelectRouteState,
  curPlaceState,
  selectedPlaceIndexState,
  modalState,
  listModalState,
  drawerState,
  loadingState,
  mapCenterState,
  lastCenterState,
  headerRoughState,
  headerHeightState,
] as const;

export const useResetMapSession = () =>
  useRecoilCallback(
    ({reset}) =>
      () => {
        Toast.hide();
        transientMapSessionState.forEach(state => reset(state));
      },
    [],
  );
