import React, {useEffect} from 'react';
import {Marker} from 'react-native-nmap';
import {Center, PlaceDetail} from '../../config/types/coordinate';
import {useRecoilState} from 'recoil';
import {modalState} from '../../atoms/modalState';
import {mapCenterState} from '../../atoms/mapCenterState';
import {markerList} from '../../config/consts/image';
import {
  DEFAULT_MARKER_HEIGHT,
  DEFAULT_MARKER_WIDTH,
  ELLIPSE_MARKER_HEIGHT,
  ELLIPSE_MARKER_WIDTH,
  LARGE_MARKER_HEIGHT,
  LARGE_MARKER_WIDTH,
} from '../../config/consts/map';
import {curPlaceState} from '../../atoms/curPlaceState';
import {lastCenterState} from '../../atoms/lastCenterState';
import {selectedPlaceIndexState} from '../../atoms/selectedPlaceIndexState';
import {listModalState} from '../../atoms/listModalState';

const SelectedMarker = (props: any) => {
  return (
    <Marker
      {...props}
      image={markerList.selected}
      width={LARGE_MARKER_WIDTH}
      height={LARGE_MARKER_HEIGHT}
      zIndex={10}
    />
  );
};

export default function OmwMarker({
  resultList,
  setShowAlternative,
}: {
  resultList: PlaceDetail[];
  setShowAlternative: (showAlternative: boolean) => void;
}) {
  const [modalVisible, setModalVisible] = useRecoilState<boolean>(modalState);
  const [, setListModalVisible] = useRecoilState<boolean>(listModalState);
  const [, setCurPlace] = useRecoilState<PlaceDetail | null>(curPlaceState);

  const [center, setCenter] = useRecoilState<Center>(mapCenterState);
  const [lastCenter, setLastCenter] = useRecoilState<Center>(lastCenterState);

  const [selected, setSelected] = useRecoilState<number>(
    selectedPlaceIndexState,
  );

  const markerOnClick = (index: number) => {
    setModalVisible(true);
    setSelected(index);
    setShowAlternative(true);
  };

  useEffect(() => {
    if (!modalVisible) {
      setSelected(-1);
    }
  }, [modalVisible]);

  useEffect(() => {
    if (selected >= 0 && selected < resultList.length) {
      setCenter({
        latitude: resultList[selected].coordinate.latitude,
        longitude: resultList[selected].coordinate.longitude,
        zoom: lastCenter.zoom,
      });
      setCurPlace({...resultList[selected], max_length: resultList.length});
    }
  }, [selected]);

  useEffect(() => {
    if (resultList && resultList.length > 0) {
      setSelected(-1);
      setLastCenter(center); //FIXME: might cause dependency issue..
      setTimeout(() => {
        setSelected(0);
      }, 1000);
    }
  }, [resultList]);

  useEffect(() => {
    return () => setListModalVisible(false);
  }, []);

  return (
    <>
      {resultList.map((item: PlaceDetail, index: number) => {
        if (index === selected)
          return (
            <SelectedMarker
              key={index}
              coordinate={{
                latitude: item.coordinate.latitude,
                longitude: item.coordinate.longitude,
              }}
              onClick={() => {
                markerOnClick(index);
              }}
            />
          );
        else {
          let markerImage = markerList.basic.default;
          let zIndex = 5;
          let width = DEFAULT_MARKER_WIDTH;
          let height = DEFAULT_MARKER_HEIGHT;
          if (
            !item.reviewCnt ||
            item.reviewCnt === 0 ||
            !item.scoreAvg ||
            !item.commentCnt ||
            item.commentCnt === 0
          ) {
            if (item.open === 'Y') {
              zIndex = 5;
              markerImage = markerList.basic.on;
              width = DEFAULT_MARKER_WIDTH;
              height = DEFAULT_MARKER_HEIGHT;
            } else {
              zIndex = 1;
              if (item.open === 'N') markerImage = markerList.small.off;
              else markerImage = markerList.small.default;
              width = ELLIPSE_MARKER_WIDTH;
              height = ELLIPSE_MARKER_HEIGHT;
            }
          } else if (item.open === 'Y') markerImage = markerList.basic.on;
          else if (item.open === 'N') markerImage = markerList.basic.off;
          return (
            <Marker
              key={index}
              coordinate={{
                latitude: item.coordinate.latitude,
                longitude: item.coordinate.longitude,
              }}
              width={width}
              height={height}
              onClick={() => {
                markerOnClick(index);
              }}
              anchor={{x: 0.5, y: 1}}
              image={markerImage}
              zIndex={zIndex}
              //TODO: use different images for different categories
            />
          );
        }
      })}
    </>
  );
}
