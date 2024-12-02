import React, {useState} from 'react';
import {TextInput, TouchableOpacity, View} from 'react-native';
import {whichNavState} from '../../atoms/whichNavState';
import {useRecoilValue} from 'recoil';
import {navigationState} from '../../atoms/navigationState';
import {Navigation, WhichNav} from '../../config/types/navigation';
import ClearInputSVG from '../../assets/images/clearInput.svg';

const placeHolder = {
  start: '출발지 검색',
  end: '도착지 검색',
  editWayPoint1: '경유지 검색',
  editWayPoint2: '경유지 검색',
  newWayPoint: '경유지 검색',
};

const initialQuery = (which: WhichNav, nav: Navigation) => {
  switch (which) {
    case 'start':
      return nav.start?.name;
    case 'end':
      return nav.end?.name;
    case 'editWayPoint1':
      return nav.wayPoints[0]?.name;
    case 'editWayPoint2':
      return nav.wayPoints[1]?.name;
    case 'newWayPoint':
      return '';
  }
};

export default function InputBoxEditable({
  handleSubmit,
}: {
  handleSubmit: (query: string) => void;
}) {
  //FIXME: add, update proper source of nav states (start, end , waypoints)
  //TODO: add spinner when loading the results
  //FIXME: 이전과 변화없으면 아무것도 수행 X
  const whichNav = useRecoilValue(whichNavState);
  const nav = useRecoilValue(navigationState); //nav.start.name, nav.end.name, nav.wayPoints[0].name, nav.wayPoints[1].name
  //FIXME: type Issue here (undefined | string)
  const [query, setQuery] = useState<string>(initialQuery(whichNav, nav));

  return (
    <View className="flex w-full pr-[20px]">
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => handleSubmit(query)}
        placeholder={placeHolder[whichNav]}
        className={
          'w-full h-[40px] bg-[#F2F2F2] mb-[2px] px-[12px] flex-row items-center rounded-sm text-black'
        }
        autoFocus
      />
      <TouchableOpacity
        style={{position: 'absolute', right: 28, top: 12}}
        onPress={() => setQuery('')}>
        <ClearInputSVG width={16} height={16} />
      </TouchableOpacity>
    </View>
  );
}
