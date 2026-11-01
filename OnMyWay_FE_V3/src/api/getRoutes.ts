import {axiosInstance, isStaleLanguageError} from './axios';
import {GET_ROUTES} from '../config/consts/api';
import {Navigation} from '../config/types/navigation';
import {Routes} from '../config/types/routes';

type RoutesResponse = {
  data?: Routes;
};

export const getRoutes = async (
  params: Navigation,
  avoid?: 'toll' | 'motorway',
): Promise<Routes | null> => {
  try {
    if (!params.start || !params.end) {
      throw new Error('A start and destination are required to load routes.');
    }
    const origin = `${params.start.coordinate.longitude},${params.start.coordinate.latitude}`;
    const destination = `${params.end.coordinate.longitude},${params.end.coordinate.latitude}`;
    const waypoints =
      params.wayPoints.length > 0
        ? params.wayPoints
            .map(
              waypoint =>
                `${waypoint.coordinate.longitude},${waypoint.coordinate.latitude}`,
            )
            .join(' | ')
        : undefined;
    const response = await axiosInstance.get<RoutesResponse>(GET_ROUTES, {
      params: {origin, destination, waypoints, avoid},
    });
    return response.data.data ?? [];
  } catch (error) {
    if (isStaleLanguageError(error)) return null;
    throw error;
  }
};
