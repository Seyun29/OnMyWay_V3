import React, {useEffect, useMemo, useRef, useState} from 'react';
// import {FlatList} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {useRecoilState} from 'recoil';
import {modalState} from '../../atoms/modalState';
import {listModalState} from '../../atoms/listModalState';
import {PlaceDetail} from '../../config/types/coordinate';
import ListBottomSheetComponent from './listBottomSheetComponent';
import {FlatList} from 'react-native-gesture-handler';
import {View, Text, TouchableOpacity} from 'react-native';
import {selectedPlaceIndexState} from '../../atoms/selectedPlaceIndexState';
import {
  filterByOpen,
  filterByParking,
  sortByReview,
  sortByScore,
} from '../../config/helpers/filter';
import FilterSVG from '../../assets/images/filter.svg';
import Spinner from '../spinner';

export default function ListBottomSheet({
  result,
  setResult,
  originalResult,
  showAlternative,
}: {
  result: PlaceDetail[] | null;
  setResult: (result: PlaceDetail[]) => void;
  originalResult: PlaceDetail[] | null;
  showAlternative: boolean;
}) {
  const [, setModalVisible] = useRecoilState<boolean>(modalState);
  const [listModalVisible, setListModalVisible] =
    useRecoilState<boolean>(listModalState);
  const [, setSelected] = useRecoilState<number>(selectedPlaceIndexState);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedObj, setSelectedObj] = useState({
    open: false,
    parking: false,
    score: false,
    review: false,
  });

  const flatListRef = useRef<FlatList>(null);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['30%', '50%', '77%'], []);

  const selectTextColor = (selected: boolean): string =>
    selected ? '#2D7FF9' : '#A8A8A8';
  const selectBorderColor = (selected: boolean): string =>
    selected ? '#9CC7FF' : '#A8A8A8';
  const selectBGColor = (selected: boolean): string =>
    selected ? '#EBF2FF' : 'transparent';
  //@ts-ignore
  const selectedNum = () => {
    let count = 0;
    for (const key in selectedObj) {
      //@ts-ignore
      if (selectedObj[key]) count++;
    }
    return count;
  };

  const handleClickIsOpen = () => {
    setLoading(true);
    if (selectedObj.open) {
      //on unselect
      const listToSort = selectedObj.parking
        ? filterByParking(originalResult || [])
        : originalResult;
      if (selectedObj.score) {
        const sorted = sortByScore(listToSort || []);
        setResult(sorted);
      } else if (selectedObj.review) {
        const sorted = sortByReview(listToSort || []);
        setResult(sorted);
      } else setResult(listToSort || []);
      setSelectedObj({
        ...selectedObj,
        open: false,
      });
    } else {
      if (result) {
        const filtered = filterByOpen(result);
        setResult(filtered);
      }
      setSelectedObj({
        ...selectedObj,
        open: true,
      });
    }
    setTimeout(() => setLoading(false), 50);
    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
  };

  const handleClickIsParking = () => {
    setLoading(true);
    if (selectedObj.parking) {
      //on unselect
      const listToSort = selectedObj.open
        ? filterByOpen(originalResult || [])
        : originalResult;
      if (selectedObj.score) {
        const sorted = sortByScore(listToSort || []);
        setResult(sorted);
      } else if (selectedObj.review) {
        const sorted = sortByReview(listToSort || []);
        setResult(sorted);
      } else setResult(listToSort || []);
      setSelectedObj({
        ...selectedObj,
        parking: false,
      });
    } else {
      if (result) {
        const filtered = filterByParking(result);
        setResult(filtered);
      }
      setSelectedObj({
        ...selectedObj,
        parking: true,
      });
    }
    setTimeout(() => setLoading(false), 50);
    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
  };

  const handleSortByScore = () => {
    setLoading(true);
    if (selectedObj.score) {
      //on unselect
      if (selectedObj.open) {
        const filtered = filterByOpen(originalResult || []);
        setResult(filtered);
      } else {
        setResult(originalResult || []);
      }
      setSelectedObj({
        ...selectedObj,
        score: false,
      });
    } else {
      if (result) {
        const sorted = sortByScore(result);
        setResult(sorted);
      }
      setSelectedObj({
        ...selectedObj,
        review: false,
        score: true,
      });
    }
    setTimeout(() => setLoading(false), 50);
    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
  };

  const handleSortByReview = () => {
    setLoading(true);
    if (selectedObj.review) {
      //on unselect
      if (selectedObj.open) {
        const filtered = filterByOpen(originalResult || []);
        setResult(filtered);
      } else setResult(originalResult || []);
      setSelectedObj({
        ...selectedObj,
        review: false,
      });
    } else {
      if (result) {
        const sorted = sortByReview(result);
        setResult(sorted);
      }
      setSelectedObj({
        ...selectedObj,
        score: false,
        review: true,
      });
    }
    setTimeout(() => setLoading(false), 50);
    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
  };

  useEffect(() => {
    if (listModalVisible) {
      setModalVisible(false);
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.close();
      if (showAlternative) setModalVisible(true);
    }
  }, [listModalVisible]);

  useEffect(() => {
    setSelectedObj({
      open: false,
      score: false,
      review: false,
      parking: false,
    });
  }, [originalResult]);

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onDismiss={() => setListModalVisible(false)}
        enableDismissOnClose
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.32,
          shadowRadius: 5.46,
          elevation: 9,
        }}>
        <BottomSheetView
          style={{
            flex: 1,
            height: '100%',
            paddingHorizontal: 18,
          }}>
          <View className="flex-row gap-x-2 items-center">
            <View
              className="flex-row justify-center items-center gap-x-1 border pl-1 pr-2 py-1 rounded-full"
              style={{
                borderColor: selectedNum() ? '#9CC7FF' : '#A8A8A8',
                backgroundColor: selectedNum() ? '#EBF2FF' : 'transparent',
              }}>
              <FilterSVG />
              {selectedNum() && (
                <Text style={{color: '#A8A8A8'}}>{selectedNum()}</Text>
              )}
            </View>
            <TouchableOpacity
              className="px-2 py-1.5 rounded-xl border"
              style={{
                borderColor: selectBorderColor(selectedObj.open),
                backgroundColor: selectBGColor(selectedObj.open),
              }}
              onPress={handleClickIsOpen}>
              <Text
                className="text-xs"
                style={{color: selectTextColor(selectedObj.open)}}>
                영업중
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-2 py-1.5 rounded-xl border"
              style={{
                borderColor: selectBorderColor(selectedObj.parking),
                backgroundColor: selectBGColor(selectedObj.parking),
              }}
              onPress={handleClickIsParking}>
              <Text
                className="text-xs"
                style={{color: selectTextColor(selectedObj.parking)}}>
                주차 가능
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-2 py-1.5 rounded-xl border"
              style={{
                borderColor: selectBorderColor(selectedObj.score),
                backgroundColor: selectBGColor(selectedObj.score),
              }}
              onPress={handleSortByScore}>
              <Text
                className="text-xs"
                style={{color: selectTextColor(selectedObj.score)}}>
                평점 좋은 순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-2 py-1.5 rounded-xl border"
              style={{
                borderColor: selectBorderColor(selectedObj.review),
                backgroundColor: selectBGColor(selectedObj.review),
              }}
              onPress={handleSortByReview}>
              <Text
                className="text-xs"
                style={{color: selectTextColor(selectedObj.review)}}>
                후기 많은 순
              </Text>
            </TouchableOpacity>
          </View>
          {result &&
            (loading ? (
              <Spinner />
            ) : (
              <FlatList
                ref={flatListRef}
                className="flex-1 w-full pt-2 flex-col"
                data={result}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (
                  <ListBottomSheetComponent
                    placeInfo={{
                      ...item,
                    }}
                    onSelect={() => {
                      setListModalVisible(false);
                      setModalVisible(true);
                      setSelected(index);
                    }}
                  />
                )}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
              />
            ))}
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
}
