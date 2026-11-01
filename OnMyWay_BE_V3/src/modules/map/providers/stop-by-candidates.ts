import { StopByStrategy } from './map-provider.port';

export interface StopByCandidate {
  waypoints: string;
  strategy: StopByStrategy;
}

// FE waypoint 계약(" | " 구분)을 유지하면서 stopby 삽입 위치 후보를 만든다.
export const buildStopByCandidates = (
  stopby: string,
  waypoints?: string,
): StopByCandidate[] => {
  if (!waypoints) return [{ waypoints: stopby, strategy: 'FRONT' }];
  const existing = waypoints.split(' | ');
  if (existing.length === 2) {
    return [
      {
        waypoints: `${stopby} | ${existing[0]} | ${existing[1]}`,
        strategy: 'FRONT',
      },
      {
        waypoints: `${existing[0]} | ${stopby} | ${existing[1]}`,
        strategy: 'MIDDLE',
      },
      {
        waypoints: `${existing[0]} | ${existing[1]} | ${stopby}`,
        strategy: 'REAR',
      },
    ];
  }
  if (existing.length === 1) {
    return [
      { waypoints: `${stopby} | ${waypoints}`, strategy: 'FRONT' },
      { waypoints: `${waypoints} | ${stopby}`, strategy: 'REAR' },
    ];
  }
  return [];
};
