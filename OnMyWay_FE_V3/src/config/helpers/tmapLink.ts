import {NavDetail} from '../types/navigation';

/**
 * Builds a credential-free TMAP app handoff URL.
 * TMAP's URL scheme accepts only the final destination in this integration;
 * OnMyWay's start point and waypoints remain available through Naver Map.
 */
export const createTmapRouteUrl = (destination: NavDetail): string => {
  const {latitude, longitude} = destination.coordinate;
  const query = [
    `goalname=${encodeURIComponent(destination.name)}`,
    `goalx=${encodeURIComponent(String(longitude))}`,
    `goaly=${encodeURIComponent(String(latitude))}`,
  ].join('&');

  return `tmap://route?${query}`;
};
