import {GET_STOPBY_DURATION} from '../config/consts/api';
import {Coordinate} from '../config/types/coordinate';
import {Navigation} from '../config/types/navigation';
import {Priority} from '../config/types/routes';
import {axiosInstance} from './axios';

export const getStopByDuration = async (
  nav: Navigation,
  stopBy: Coordinate,
  priority?: Priority,
  avoidTolls?: boolean,
) => {
  try {
    if (!nav.start || !nav.end) return null;

    const origin = `${nav.start.coordinate.longitude},${nav.start.coordinate.latitude}`;
    const destination = `${nav.end.coordinate.longitude},${nav.end.coordinate.latitude}`;
    const waypoints =
      nav.wayPoints.length > 0
        ? nav.wayPoints
            .map(
              waypoint =>
                `${waypoint.coordinate.longitude},${waypoint.coordinate.latitude}`,
            )
            .join(' | ')
        : undefined;

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
    return response.data.data;
  } catch (_error) {
    return null;
  }
};
