import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import StarFilledSVG from '../../assets/images/starFilled.svg';
import StarUnFilledSVG from '../../assets/images/starUnfilled.svg';
import {useRecoilState} from '../../state/atom';
import {selectedPlaceIndexState} from '../../atoms/selectedPlaceIndexState';
import {useTranslation} from '../../hooks/useTranslation';
import {PlaceDetail} from '../../config/types/coordinate';

function Stars({scoreAvg}: {scoreAvg: number}) {
  const stars = [<StarFilledSVG key={1} />];
  for (let i = 2; i <= 5; i++) {
    if (i <= scoreAvg) {
      stars.push(<StarFilledSVG key={i} />);
    } else {
      stars.push(<StarUnFilledSVG key={i} />);
    }
  }
  return <>{stars}</>;
}

export default function ListBottomSheetComponent({
  placeInfo,
  onSelect,
}: {
  placeInfo: PlaceDetail;
  onSelect: () => void;
}) {
  const {t} = useTranslation();
  const {
    place_name,
    address_name,
    open,
    photoUrl,
    commentCnt,
    reviewCnt,
    scoreAvg,
    parking,
  } = placeInfo;

  const placeName = place_name || address_name || '';
  const score = Number(scoreAvg ?? 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onSelect}>
      <Image
        source={
          photoUrl
            ? {uri: photoUrl}
            : require('../../assets/images/defaultThumbnail.png')
        }
        style={styles.thumbnail}
      />
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={1}
            style={styles.placeName}
            className={
              'font-semibold ' +
              (placeName.length > 14
                ? 'text-xs'
                : placeName.length > 10
                ? 'text-xs'
                : placeName.length > 7
                ? 'text-sm'
                : 'text-base')
            }>
            {place_name}
          </Text>
          {open ? (
            <View
              className="rounded-lg px-1 py-0.5 justify-center items-center"
              style={{
                borderWidth: 1,
                borderColor: '#338A17',
              }}>
              <Text
                className="text-xs"
                style={{
                  color: '#338A17',
                }}>
                {t('bottom.open')}
              </Text>
            </View>
          ) : (
            <></>
          )}
          {parking ? (
            <View
              className="rounded-lg px-1 py-0.5 justify-center items-center"
              style={{
                borderWidth: 1,
                borderColor: '#338A17',
              }}>
              <Text
                className="text-xs"
                style={{
                  color: '#338A17',
                }}>
                {t('bottom.parking')}
              </Text>
            </View>
          ) : (
            <></>
          )}
        </View>
        <View className="flex-row items-center py-0.5">
          {score > 0 ? (
            <>
              <Text
                className="text-sm font-light text-center mr-1"
                style={{
                  color: '#F82B60',
                }}>
                {scoreAvg}
              </Text>
              <Stars scoreAvg={score} />
              {commentCnt !== undefined &&
              commentCnt !== null &&
              commentCnt > 0 ? (
                <Text
                  className="text-sm ml-1"
                  style={{
                    color: '#7C7C7C',
                  }}>
                  {`(${commentCnt})`}
                </Text>
              ) : (
                <></>
              )}
            </>
          ) : (
            <></>
          )}
          {reviewCnt !== undefined && reviewCnt !== null ? (
            <Text
              className={scoreAvg ? 'text-sm ml-2' : 'text-sm'}
              style={{
                color: '#7C7C7C',
              }}>
              {t('common.reviewCount', {count: reviewCnt})}
            </Text>
          ) : (
            <></>
          )}
        </View>
        <Text
          className="text-xs"
          numberOfLines={2}
          style={{
            color: '#7C7C7C',
          }}>
          {address_name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    paddingTop: 12,
    paddingVertical: 8,
  },
  thumbnail: {
    width: 70,
    height: 70,
    flexShrink: 0,
    marginRight: 16,
    borderRadius: 12,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  placeName: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
});
