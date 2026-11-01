import React from 'react';
import {Routes} from '../../config/types/routes';
import {MapPath, MapPolygon} from '../maps/mapPrimitives';
import {Coordinate} from '../../config/types/coordinate';
import {createRouteBufferPolygons} from '../../config/helpers/routeBuffer';

const SEARCH_FILL_COLOR = '#F552A814';
const SEARCH_BOUNDARY_COLOR = '#F552A84D';
const SEARCH_BOUNDARY_WIDTH = 1;
const BOUNDARY_UPDATE_DELAY_MS = 120;

export function SearchRadiusIndicator({
  path,
  radiusKm,
}: {
  path: Coordinate[];
  radiusKm: number;
}) {
  const [bufferRadiusKm, setBufferRadiusKm] = React.useState(radiusKm);

  React.useEffect(() => {
    const timeout = setTimeout(
      () => setBufferRadiusKm(radiusKm),
      BOUNDARY_UPDATE_DELAY_MS,
    );
    return () => clearTimeout(timeout);
  }, [radiusKm]);

  const polygons = React.useMemo(
    () => createRouteBufferPolygons(path, bufferRadiusKm),
    [path, bufferRadiusKm],
  );

  if (polygons.length === 0) return null;

  return (
    <>
      {polygons.map(({outer, holes}, polygonIndex) => (
        <React.Fragment key={`search-polygon-${polygonIndex}`}>
          <MapPolygon
            coordinates={outer}
            holes={holes}
            fillColor={SEARCH_FILL_COLOR}
            strokeWidth={0}
            zIndex={-2}
          />
          {[outer, ...holes].map((coordinates, ringIndex) => (
            <MapPath
              key={`search-boundary-${polygonIndex}-${ringIndex}`}
              color={SEARCH_BOUNDARY_COLOR}
              coordinates={coordinates}
              width={SEARCH_BOUNDARY_WIDTH}
              outlineWidth={0}
              outlineColor="transparent"
              zIndex={0}
            />
          ))}
        </React.Fragment>
      ))}
    </>
  );
}

export function DefaultPath({path}: {path: Coordinate[]}) {
  return (
    <MapPath
      color="#949494"
      coordinates={path}
      width={8}
      outlineWidth={0}
      zIndex={-1}
    />
  );
}

export function SelectedPath({path}: {path: Coordinate[]}) {
  return (
    <MapPath
      color={'#20C933'}
      coordinates={path}
      width={10}
      outlineWidth={1}
      outlineColor="#FFFFFF"
      zIndex={1}
    />
  );
}

export function OMWPath({path}: {path: Coordinate[]}) {
  return (
    <MapPath
      color={'#20C933'}
      coordinates={path}
      width={10}
      outlineWidth={1}
      outlineColor="#FFFFFF"
      zIndex={1}
    />
  );
}

export default function CandidatePaths({routes}: {routes: Routes}) {
  switch (routes.length) {
    case 0:
      return <></>;
    case 1:
      return <SelectedPath path={routes[0].path} />;
    case 2:
      return (
        <>
          <DefaultPath path={routes[1].path} />
          <SelectedPath path={routes[0].path} />
        </>
      );
    case 3:
      return (
        <>
          <DefaultPath path={routes[1].path} />
          <DefaultPath path={routes[2].path} />
          <SelectedPath path={routes[0].path} />
        </>
      );
    default:
      return <></>;
  }
}
