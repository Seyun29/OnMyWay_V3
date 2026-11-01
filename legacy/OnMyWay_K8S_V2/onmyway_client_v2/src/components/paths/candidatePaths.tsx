import React from 'react';
import {Routes} from '../../config/types/routes';
import {Path} from 'react-native-nmap';
import {Coordinate} from '../../config/types/coordinate';

export function DefaultPath({path}: {path: Coordinate[]}) {
  return (
    <Path
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
    <Path
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
    <Path
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
