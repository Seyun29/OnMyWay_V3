import {GET_STOPBY_DURATION} from '../config/consts/api';
import {Coordinate} from '../config/types/coordinate';
import {Navigation} from '../config/types/navigation';
import {axiosInstance} from './axios';

export const getStopByDuration = async (
  nav: Navigation,
  stopBy: Coordinate,
  priority?: string,
  avoidTolls?: boolean,
) => {
  try {
    const origin = `${nav.start?.coordinate.longitude},${nav.start?.coordinate.latitude}`;
    const destination = `${nav.end?.coordinate.longitude},${nav.end?.coordinate.latitude}`;
    const waypoints =
      nav.wayPoints &&
      nav.wayPoints
        .map(x => `${x.coordinate.longitude},${x.coordinate.latitude}`)
        .join(' | ');

    const response = await axiosInstance.get(GET_STOPBY_DURATION, {
      params: {
        origin,
        destination,
        waypoints,
        priority,
        avoid: avoidTolls ? 'toll' : undefined,
        stopby: `${stopBy.longitude},${stopBy.latitude}`,
      },
    });
    return response.data.data; //time in seconds
  } catch (error) {
    console.log('getStopByDuration error, Params: ', nav, stopBy);
    return null;
  }
};
