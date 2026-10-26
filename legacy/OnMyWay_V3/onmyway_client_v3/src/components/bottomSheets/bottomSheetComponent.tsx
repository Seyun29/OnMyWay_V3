//@ts-ignore
import React, {useEffect, useState} from 'react';
import {View, Text, Image, TouchableOpacity, Alert} from 'react-native';
import StarFilledSVG from '../../assets/images/starFilled.svg';
import StarUnFilledSVG from '../../assets/images/starUnfilled.svg';
import BlinkStarsSVG from '../../assets/images/blinkStars.svg';
import LeftIconSVG from '../../assets/images/leftIcon.svg';
import RightIconSVG from '../../assets/images/rightIcon.svg';
import {useRecoilState} from 'recoil';
import {selectedPlaceIndexState} from '../../atoms/selectedPlaceIndexState';

function Stars({scoreAvg}: {scoreAvg: number}) {
  const stars = [<StarFilledSVG key={1} />];
  for (let i = 2; i <= 5; i++) {
    if (i <= scoreAvg) {
      stars.push(<StarFilledSVG key={i} />);
    } else {
      stars.push(<StarUnFilledSVG key={i} />);
    }
  }
  return stars;
}

export default function BottomSheetComponent({
  placeInfo,
  stopByLoading,
  onPress,
}: {
  placeInfo: any;
  stopByLoading: boolean;
  onPress: any;
}) {
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

  const [selected, setSelected] = useRecoilState<number>(
    selectedPlaceIndexState,
  );
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!stopByDuration)
      interval = setInterval(() => {
        setDots(currentDots => {
          if (currentDots.length > 4) return '.';
          else return currentDots + '.';
        });
      }, 500);
    else if (interval) clearInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stopByLoading]);

  return (
    <View className="flex-1 px-5">
      <View className="w-full flex-row justify-between gap-x-1.5 items-center">
        {selected > 0 ? (
          <TouchableOpacity
            onPress={() => {
              if (selected > 0 && selected <= max_length - 1)
                setSelected(selected - 1);
            }}
            disabled={stopByLoading}>
            <LeftIconSVG width={17} height={17} />
          </TouchableOpacity>
        ) : (
          <View style={{width: 17, height: 17}} />
        )}
        <View className="flex-1 flex-row px-4 py-1.5 bg-[#EBF2FF] rounded-lg items-center">
          <BlinkStarsSVG width={17} height={17} />
          {stopByDuration ? (
            <>
              <Text className="text-sm ml-1">{'경유시 도착지까지 '}</Text>
              <Text className="text-sm text-[#FF4D4D] font-semibold">{`${Math.max(
                0,
                Math.floor(stopByDuration / 60) -
                  Math.floor(originalDuration / 60),
              )}분`}</Text>
              <Text className="text-sm">{' 더 소요됩니다'}</Text>
            </>
          ) : (
            <Text className="text-sm ml-1">{`경유 시간을 계산 중 입니다${dots}`}</Text>
          )}
        </View>
        {selected < max_length - 1 ? (
          <TouchableOpacity
            onPress={() => {
              if (selected >= 0 && selected < max_length - 1)
                setSelected(selected + 1);
            }}
            disabled={stopByLoading}>
            <RightIconSVG width={17} height={17} />
          </TouchableOpacity>
        ) : (
          <View style={{width: 17, height: 17}} />
        )}
      </View>
      <TouchableOpacity
        className="flex-1 flex-row w-full pt-3"
        onPress={onPress}>
        <Image
          source={
            photoUrl
              ? {uri: photoUrl}
              : require('../../assets/images/defaultThumbnail.png')
          }
          style={{width: 80, height: 80, marginRight: 20, borderRadius: 12}}
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-x-2">
            <Text
              className={
                'font-semibold ' + //FIXME: 글자 크기 fix, parking이 있는걸로 인식되나? 확인
                (place_name.length > 14
                  ? 'text-xs'
                  : place_name.length > 10
                  ? 'text-sm'
                  : place_name.length > 7
                  ? open && parking
                    ? 'text-sm'
                    : 'text-base'
                  : open && parking
                  ? 'text-base'
                  : 'text-lg')
              }>
              {place_name}
            </Text>
            {open && (
              <View
                className="rounded-lg px-1 py-0.5 justify-center items-center"
                style={{
                  borderWidth: 1,
                  borderColor: open === 'Y' ? '#338A17' : '#FF4D4D',
                }}>
                <Text
                  className="text-xs"
                  style={{
                    color: open === 'Y' ? '#338A17' : '#FF4D4D',
                  }}>
                  {open === 'Y' ? '영업중' : '영업종료'}
                </Text>
              </View>
            )}
            {parking && (
              <View
                className="rounded-lg px-1 py-0.5 justify-center items-center"
                style={{
                  borderWidth: 1,
                  borderColor: parking === 'Y' ? '#338A17' : '#FF4D4D',
                }}>
                <Text
                  className="text-xs"
                  style={{
                    color: parking === 'Y' ? '#338A17' : '#FF4D4D',
                  }}>
                  {parking === 'Y' ? '주차가능' : '주차불가'}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center">
            {scoreAvg && (
              <>
                <Text
                  className="text-sm font-light text-center mr-1"
                  style={{
                    color: '#F82B60',
                  }}>
                  {scoreAvg}
                </Text>
                <Stars scoreAvg={parseFloat(scoreAvg)} />
                {commentCnt && (
                  <Text
                    className="text-sm ml-1 mr-1"
                    style={{
                      color: '#7C7C7C',
                    }}>
                    {`(${commentCnt})`}
                  </Text>
                )}
              </>
            )}
            {reviewCnt && (
              <Text
                className="text-sm"
                style={{
                  color: '#7C7C7C',
                }}>
                {`리뷰 ${reviewCnt}`}
              </Text>
            )}
          </View>
          <Text
            className="text-xs"
            style={{
              color: '#7C7C7C',
            }}>
            {address_name}
          </Text>
          {tags && tags.length > 0 && (
            <View>
              <View className="flex-row items-center pt-0.5">
                {tags.map((tag: string, index: number) => {
                  if (index >= 2) return null;
                  return (
                    <View
                      key={index}
                      className="rounded px-1 py-0.5 mr-2"
                      style={{
                        backgroundColor: '#F2F2F2',
                      }}>
                      <Text
                        className="text-xs"
                        style={{
                          color: '#A8A8A8',
                        }}>
                        {'# ' + tag}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {tags.length > 2 && (
                <View className="flex-row items-center pt-0.5">
                  {tags.map((tag: string, index: number) => {
                    if (index >= 2 && index <= 3)
                      return (
                        <View
                          key={index}
                          className="rounded px-1 py-0.5 mr-2"
                          style={{
                            backgroundColor: '#F2F2F2',
                          }}>
                          <Text
                            className="text-xs"
                            style={{
                              color: '#A8A8A8',
                            }}>
                            {'# ' + tag}
                          </Text>
                        </View>
                      );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
