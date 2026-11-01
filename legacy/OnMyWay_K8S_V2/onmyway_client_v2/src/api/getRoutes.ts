// @ts-nocheck
import {axiosInstance} from './axios';
import {GET_ROUTES} from '../config/consts/api';
import {Navigation} from '../config/types/navigation';

export const getRoutes = async (params: Navigation, avoid?: string) => {
  try {
    const origin = `${params.start?.coordinate.longitude},${params.start?.coordinate.latitude}`;
    const destination = `${params.end?.coordinate.longitude},${params.end?.coordinate.latitude}`;
    const waypoints =
      params.wayPoints &&
      params.wayPoints
        .map(x => `${x.coordinate.longitude},${x.coordinate.latitude}`)
        .join(' | ');
    const response = await axiosInstance.get(GET_ROUTES, {
      params: {
        origin,
        destination,
        waypoints,
        avoid,
      },
    });
    return response.data?.data;
  } catch (error) {
    console.log('getRoutes error, Params: ', query);
  }
};
