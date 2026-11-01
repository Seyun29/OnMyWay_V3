import React, {useEffect, useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import StarFilledSVG from '../../assets/images/starFilled.svg';
import StarUnFilledSVG from '../../assets/images/starUnfilled.svg';
import BlinkStarsSVG from '../../assets/images/blinkStars.svg';
import LeftIconSVG from '../../assets/images/leftIcon.svg';
import RightIconSVG from '../../assets/images/rightIcon.svg';
import AddStopOverSVG from '../../assets/images/addStopOver.svg';
import {useRecoilState} from '../../state/atom';
import {selectedPlaceIndexState} from '../../atoms/selectedPlaceIndexState';
import {useTranslation} from '../../hooks/useTranslation';
import {PlaceDetail} from '../../config/types/coordinate';

type BottomSheetPlaceInfo = PlaceDetail & {
  max_length?: number;
  stopByDuration?: number;
  originalDuration?: number;
};

function Stars({scoreAvg}: {scoreAvg: number}) {
  const stars = [<StarFilledSVG key={1} width={14} height={14} />];
  for (let i = 2; i <= 5; i++) {
    if (i <= scoreAvg) {
      stars.push(<StarFilledSVG key={i} width={14} height={14} />);
    } else {
      stars.push(<StarUnFilledSVG key={i} width={14} height={14} />);
    }
  }
  return <>{stars}</>;
}

export default function BottomSheetComponent({
  placeInfo,
  stopByLoading,
  onPress,
  onAddWaypoint,
  addWaypointDisabled,
}: {
  placeInfo: BottomSheetPlaceInfo;
  stopByLoading: boolean;
  onPress: () => void;
  onAddWaypoint: () => void;
  addWaypointDisabled: boolean;
}) {
  const {t} = useTranslation();
  const {
    stopByDuration,
    originalDuration,
    place_name,
    address_name,
    open,
    tags,
    photoUrl,
    commentCnt,
    reviewCnt,
    scoreAvg,
    max_length,
    parking,
  } = placeInfo;
  const itemCount = max_length ?? 1;
  const baseDuration = originalDuration ?? 0;
  const score = Number(scoreAvg ?? 0);

  const [selected, setSelected] = useRecoilState<number>(
    selectedPlaceIndexState,
  );
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    if (!stopByLoading) {
      setDots('');
      return;
    }
    const interval = setInterval(() => {
      setDots(currentDots => (currentDots.length >= 4 ? '.' : currentDots + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [stopByLoading]);

  const hasDetourDuration = typeof stopByDuration === 'number';
  const visibleTags = tags?.slice(0, 2) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.detourRow}>
        {selected > 0 ? (
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => setSelected(selected - 1)}
            disabled={stopByLoading}>
            <LeftIconSVG width={17} height={17} />
          </TouchableOpacity>
        ) : (
          <View style={styles.arrowButton} />
        )}
        <View style={styles.detourBanner}>
          <BlinkStarsSVG width={17} height={17} />
          <Text style={styles.detourText} numberOfLines={1}>
            {hasDetourDuration
              ? t('bottom.detourDuration', {
                  minutes: Math.max(
                    0,
                    Math.floor(stopByDuration / 60) -
                      Math.floor(baseDuration / 60),
                  ),
                })
              : t('bottom.detourCalculating', {
                  dots: stopByLoading ? dots : '',
                })}
          </Text>
        </View>
        {selected < itemCount - 1 ? (
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => setSelected(selected + 1)}
            disabled={stopByLoading}>
            <RightIconSVG width={17} height={17} />
          </TouchableOpacity>
        ) : (
          <View style={styles.arrowButton} />
        )}
      </View>

      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
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
            <Text style={styles.placeName} numberOfLines={1}>
              {place_name}
            </Text>
            {open && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('bottom.open')}</Text>
              </View>
            )}
            {parking && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('bottom.parking')}</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            {score > 0 && (
              <>
                <Text style={styles.score}>{scoreAvg}</Text>
                <Stars scoreAvg={score} />
                {typeof commentCnt === 'number' && commentCnt > 0 && (
                  <Text style={styles.mutedText}>{`(${commentCnt})`}</Text>
                )}
              </>
            )}
            {typeof reviewCnt === 'number' && reviewCnt > 0 && (
              <Text style={styles.mutedText} numberOfLines={1}>
                {t('common.reviewCount', {count: reviewCnt})}
              </Text>
            )}
          </View>
          <Text style={styles.address} numberOfLines={2}>
            {address_name}
          </Text>
          {visibleTags.length > 0 && (
            <View style={styles.tagsRow}>
              {visibleTags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    {'# ' + tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.addWaypointButton,
          addWaypointDisabled && styles.addWaypointButtonDisabled,
        ]}
        onPress={onAddWaypoint}
        disabled={addWaypointDisabled}>
        <AddStopOverSVG width={18} height={18} />
        <Text style={styles.addWaypointText}>
          {t(stopByLoading ? 'waypoint.calculating' : 'waypoint.add')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minWidth: 0,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  detourRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  arrowButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detourBanner: {
    flex: 1,
    minWidth: 0,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detourText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 4,
    color: '#3D3D3D',
    fontSize: 13,
  },
  card: {
    width: '100%',
    minWidth: 0,
    minHeight: 92,
    flexDirection: 'row',
    paddingTop: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
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
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#338A17',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#338A17',
    fontSize: 11,
  },
  ratingRow: {
    minHeight: 20,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 3,
  },
  score: {
    marginRight: 1,
    color: '#F82B60',
    fontSize: 13,
    fontWeight: '300',
  },
  mutedText: {
    flexShrink: 1,
    marginLeft: 3,
    color: '#7C7C7C',
    fontSize: 12,
  },
  address: {
    color: '#7C7C7C',
    fontSize: 12,
    lineHeight: 16,
  },
  tagsRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 3,
    columnGap: 6,
  },
  tag: {
    maxWidth: '48%',
    borderRadius: 4,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tagText: {
    color: '#A8A8A8',
    fontSize: 11,
  },
  addWaypointButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2D7FF9',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  addWaypointButtonDisabled: {
    borderColor: '#D9D9D9',
    opacity: 0.5,
  },
  addWaypointText: {
    marginLeft: 6,
    color: '#2D7FF9',
    fontSize: 13,
    fontWeight: '600',
  },
});
