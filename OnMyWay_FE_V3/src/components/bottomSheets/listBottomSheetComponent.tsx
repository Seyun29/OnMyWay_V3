//@ts-ignore
import React, {useEffect, useState} from 'react';
import {View, Text, Image, TouchableOpacity, Touchable} from 'react-native';
import StarFilledSVG from '../../assets/images/starFilled.svg';
import StarUnFilledSVG from '../../assets/images/starUnfilled.svg';
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

export default function ListBottomSheetComponent({
  placeInfo,
  onSelect,
}: {
  placeInfo: any;
  onSelect: any;
}) {
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

  const placeName = place_name ? place_name : address_name;

  return (
    <TouchableOpacity className="py-2 flex-row w-full pt-3" onPress={onSelect}>
      <Image
        source={
          photoUrl
            ? {uri: photoUrl}
            : require('../../assets/images/defaultThumbnail.png')
        }
        style={{width: 70, height: 70, marginRight: 20, borderRadius: 12}}
      />
      <View>
        <View className="flex-row items-center gap-x-1.5">
          <Text
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
        <View className="flex-row items-center py-0.5">
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
                  className="text-sm ml-1"
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
              className={scoreAvg ? 'text-sm ml-2' : 'text-sm'}
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
      </View>
    </TouchableOpacity>
  );
}
