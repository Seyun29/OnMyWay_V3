import {Coordinate} from './coordinate';

export type Priority = 'RECOMMEND' | 'TIME' | 'DISTANCE';

export interface RouteDetail {
  priority: Priority;
  duration: number;
  distance: number;
  path: Coordinate[];
  avoidTolls?: boolean; //if True : 무료도로 우선
}

export type Routes = RouteDetail[];
