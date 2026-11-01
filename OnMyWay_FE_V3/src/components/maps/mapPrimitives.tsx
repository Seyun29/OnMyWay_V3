import React from 'react';
import {Image, type ImageRequireSource} from 'react-native';
import {
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
  NaverMapPolygonOverlay,
} from '@mj-studio/react-native-naver-map';
import {
  Marker as GoogleMarker,
  Polygon as GooglePolygon,
  Polyline,
} from 'react-native-maps';
import {useRecoilValue} from '../../state/atom';
import {mapRendererState} from '../../atoms/mapRendererState';
import {Coordinate} from '../../config/types/coordinate';

export interface MapMarkerProps {
  coordinate: Coordinate;
  image: ImageRequireSource;
  width: number;
  height: number;
  anchor?: {x: number; y: number};
  zIndex?: number;
  onClick?: () => void;
}

// Both renderers use a bottom-center marker anchor by default.
const DEFAULT_ANCHOR = {x: 0.5, y: 1};

function GoogleImageMarker({
  coordinate,
  image,
  width,
  height,
  anchor = DEFAULT_ANCHOR,
  zIndex,
  onClick,
}: MapMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = React.useState(true);
  const firstFrameRef = React.useRef<number | null>(null);
  const secondFrameRef = React.useRef<number | null>(null);

  const freezeAfterNativeCapture = React.useCallback(() => {
    if (firstFrameRef.current !== null) {
      cancelAnimationFrame(firstFrameRef.current);
    }
    if (secondFrameRef.current !== null) {
      cancelAnimationFrame(secondFrameRef.current);
    }

    // Google custom markers are bitmap snapshots. Keep tracking through two
    // committed frames so the loaded image reaches the native marker first.
    firstFrameRef.current = requestAnimationFrame(() => {
      firstFrameRef.current = null;
      secondFrameRef.current = requestAnimationFrame(() => {
        secondFrameRef.current = null;
        setTracksViewChanges(false);
      });
    });
  }, []);

  React.useEffect(
    () => () => {
      if (firstFrameRef.current !== null) {
        cancelAnimationFrame(firstFrameRef.current);
      }
      if (secondFrameRef.current !== null) {
        cancelAnimationFrame(secondFrameRef.current);
      }
    },
    [],
  );

  return (
    <GoogleMarker
      coordinate={coordinate}
      anchor={anchor}
      zIndex={zIndex}
      style={{width, height}}
      tracksViewChanges={tracksViewChanges}
      onPress={event => {
        event.stopPropagation();
        onClick?.();
      }}>
      <Image
        source={image}
        style={{width, height}}
        resizeMode="contain"
        fadeDuration={0}
        onLoad={freezeAfterNativeCapture}
        onError={freezeAfterNativeCapture}
      />
    </GoogleMarker>
  );
}

export function MapMarker(props: MapMarkerProps) {
  const renderer = useRecoilValue(mapRendererState);

  if (renderer === 'GOOGLE') {
    // Remount when the asset changes so the new image is captured before tracking stops.
    return <GoogleImageMarker key={props.image} {...props} />;
  }
  return (
    <NaverMapMarkerOverlay
      latitude={props.coordinate.latitude}
      longitude={props.coordinate.longitude}
      image={props.image}
      width={props.width}
      height={props.height}
      anchor={props.anchor}
      zIndex={props.zIndex}
      onTap={props.onClick}
    />
  );
}

export interface MapPathProps {
  coordinates: Coordinate[];
  color: string;
  width: number;
  outlineWidth?: number;
  outlineColor?: string;
  zIndex?: number;
}

export function MapPath({
  coordinates,
  color,
  width,
  outlineWidth,
  outlineColor,
  zIndex,
}: MapPathProps) {
  const renderer = useRecoilValue(mapRendererState);

  if (renderer === 'GOOGLE') {
    const hasOutline = Boolean(outlineColor && outlineWidth && outlineWidth > 0);
    const baseZIndex = zIndex ?? 0;

    return (
      <>
        {hasOutline && (
          <Polyline
            coordinates={coordinates}
            strokeColor={outlineColor}
            strokeWidth={width + outlineWidth! * 2}
            zIndex={baseZIndex}
          />
        )}
        <Polyline
          coordinates={coordinates}
          strokeColor={color}
          strokeWidth={width}
          zIndex={hasOutline ? baseZIndex + 1 : baseZIndex}
        />
      </>
    );
  }
  return (
    <NaverMapPathOverlay
      coords={coordinates}
      color={color}
      width={width}
      outlineWidth={outlineWidth}
      outlineColor={outlineColor}
      zIndex={zIndex}
    />
  );
}

export interface MapPolygonProps {
  coordinates: Coordinate[];
  holes?: Coordinate[][];
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
  zIndex?: number;
}

const signedRingArea = (ring: Coordinate[]) =>
  ring.reduce((area, coordinate, index) => {
    const next = ring[(index + 1) % ring.length];
    return (
      area +
      coordinate.longitude * next.latitude -
      next.longitude * coordinate.latitude
    );
  }, 0) / 2;

const normalizeRingWinding = (
  ring: Coordinate[],
  shouldBeClockwise: boolean,
) => {
  const isClockwise = signedRingArea(ring) < 0;
  return isClockwise === shouldBeClockwise ? ring : [...ring].reverse();
};

export function MapPolygon({
  coordinates,
  holes = [],
  fillColor,
  strokeColor = 'transparent',
  strokeWidth = 0,
  zIndex,
}: MapPolygonProps) {
  const renderer = useRecoilValue(mapRendererState);

  if (renderer === 'GOOGLE') {
    return (
      <GooglePolygon
        coordinates={coordinates}
        holes={holes}
        fillColor={fillColor}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        zIndex={zIndex}
      />
    );
  }

  return (
    <NaverMapPolygonOverlay
      coords={normalizeRingWinding(coordinates, true)}
      holes={holes.map(hole => normalizeRingWinding(hole, false))}
      color={fillColor}
      outlineColor={strokeColor}
      outlineWidth={strokeWidth}
      zIndex={zIndex}
    />
  );
}
