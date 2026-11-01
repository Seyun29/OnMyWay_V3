import React, {type PropsWithChildren, useEffect, useRef} from 'react';
import {type StyleProp, type ViewStyle} from 'react-native';
import {
  NaverMapView,
  type NaverMapViewRef,
  type Region as NaverRegion,
} from '@mj-studio/react-native-naver-map';
import MapView, {PROVIDER_GOOGLE, type Region} from 'react-native-maps';
import {useRecoilValue} from '../../state/atom';
import {mapRendererState} from '../../atoms/mapRendererState';
import {Center, Coordinate} from '../../config/types/coordinate';

export interface CameraChangeEvent extends Center {
  coveringRegion: Coordinate[];
}

export interface OmwMapViewProps {
  style?: StyleProp<ViewStyle>;
  center: Center;
  zoomControl?: boolean;
  scaleBar?: boolean;
  compass?: boolean;
  onMapClick?: () => void;
  onCameraChange?: (event: CameraChangeEvent) => void;
  onTouch?: () => void;
}

const zoomFromRegion = (region: Region): number =>
  Math.log2(360 / region.longitudeDelta);

const coveringRegionFromRegion = (region: Region): Coordinate[] => {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  return [
    {
      latitude: region.latitude - halfLat,
      longitude: region.longitude - halfLng,
    },
    {
      latitude: region.latitude - halfLat,
      longitude: region.longitude + halfLng,
    },
    {
      latitude: region.latitude + halfLat,
      longitude: region.longitude + halfLng,
    },
    {
      latitude: region.latitude + halfLat,
      longitude: region.longitude - halfLng,
    },
  ];
};

const coveringRegionFromNaverRegion = (
  region: NaverRegion,
): Coordinate[] => [
  {latitude: region.latitude, longitude: region.longitude},
  {
    latitude: region.latitude,
    longitude: region.longitude + region.longitudeDelta,
  },
  {
    latitude: region.latitude + region.latitudeDelta,
    longitude: region.longitude + region.longitudeDelta,
  },
  {
    latitude: region.latitude + region.latitudeDelta,
    longitude: region.longitude,
  },
];

// 카메라 이동은 `center` 객체의 identity 변경(setCenter 호출)마다 명령으로 실행한다.
// 사용자가 지도를 pan한 뒤 같은 좌표로 setCenter해도(예: 현위치 버튼) 값 비교에
// 걸리지 않고 항상 해당 위치로 되돌아가게 하기 위함이다.
function GoogleMapContainer({
  style,
  center,
  compass,
  onMapClick,
  onCameraChange,
  onTouch,
  children,
}: PropsWithChildren<OmwMapViewProps>) {
  const mapRef = useRef<MapView>(null);
  const isFirstCenterRef = useRef(true);

  useEffect(() => {
    if (isFirstCenterRef.current) {
      // 최초 위치는 initialCamera가 처리한다.
      isFirstCenterRef.current = false;
      return;
    }
    mapRef.current?.animateCamera(
      {
        center: {latitude: center.latitude, longitude: center.longitude},
        zoom: center.zoom,
      },
      {duration: 300},
    );
  }, [center]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={style}
      initialCamera={{
        center: {latitude: center.latitude, longitude: center.longitude},
        zoom: center.zoom,
        heading: 0,
        pitch: 0,
      }}
      showsCompass={compass ?? false}
      toolbarEnabled={false}
      onPress={event => {
        if (event.nativeEvent.action !== 'marker-press') {
          onMapClick?.();
        }
      }}
      onPanDrag={onTouch}
      onRegionChangeComplete={region => {
        const coveringRegion = coveringRegionFromRegion(region);

        // longitudeDelta만으로 계산한 zoom은 viewport 너비를 반영하지 않아 실제
        // Google camera zoom보다 작다. 그 값을 현위치 이동에 재사용하면 누를 때마다
        // 줌 아웃되므로 native camera의 정확한 zoom을 사용한다.
        mapRef.current
          ?.getCamera()
          .then(camera => {
            onCameraChange?.({
              latitude: camera.center.latitude,
              longitude: camera.center.longitude,
              zoom: camera.zoom ?? zoomFromRegion(region),
              coveringRegion,
            });
          })
          .catch(() => {
            onCameraChange?.({
              latitude: region.latitude,
              longitude: region.longitude,
              zoom: zoomFromRegion(region),
              coveringRegion,
            });
          });
      }}>
      {children}
    </MapView>
  );
}

export default function OmwMapView({
  children,
  ...props
}: PropsWithChildren<OmwMapViewProps>) {
  const renderer = useRecoilValue(mapRendererState);

  if (renderer === 'GOOGLE') {
    return <GoogleMapContainer {...props}>{children}</GoogleMapContainer>;
  }
  return <NaverMapContainer {...props}>{children}</NaverMapContainer>;
}

function NaverMapContainer({
  style,
  center,
  zoomControl,
  scaleBar,
  compass,
  onMapClick,
  onCameraChange,
  onTouch,
  children,
}: PropsWithChildren<OmwMapViewProps>) {
  const mapRef = useRef<NaverMapViewRef>(null);
  const isFirstCenterRef = useRef(true);

  useEffect(() => {
    if (isFirstCenterRef.current) {
      // 최초 위치는 initialCamera가 처리한다.
      isFirstCenterRef.current = false;
      return;
    }
    mapRef.current?.animateCameraTo({
      latitude: center.latitude,
      longitude: center.longitude,
      zoom: center.zoom,
      duration: 300,
    });
  }, [center]);

  return (
    <NaverMapView
      ref={mapRef}
      style={style}
      initialCamera={center}
      animationDuration={300}
      isShowZoomControls={zoomControl}
      isShowScaleBar={scaleBar}
      isShowCompass={compass}
      mapType="Basic"
      onTapMap={onMapClick}
      onTouchStart={onTouch}
      onCameraIdle={event => {
        onCameraChange?.({
          latitude: event.latitude,
          longitude: event.longitude,
          zoom: event.zoom ?? center.zoom,
          coveringRegion: coveringRegionFromNaverRegion(event.region),
        });
      }}>
      {children}
    </NaverMapView>
  );
}
