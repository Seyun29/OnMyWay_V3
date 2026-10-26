import {useRecoilState} from 'recoil';
import {navigationState} from '../atoms/navigationState';

// 커스텀 훅
export default function useNavReverse() {
  const [, setNav] = useRecoilState(navigationState);

  const reverseNav = () => {
    setNav(prev => ({
      start: prev.end,
      wayPoints: [...prev.wayPoints].reverse(),
      end: prev.start,
    }));
  };

  return reverseNav;
}
