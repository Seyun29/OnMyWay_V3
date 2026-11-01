import React, {useState} from 'react';
import {TextInput, TouchableOpacity, View} from 'react-native';
import {whichNavState} from '../../atoms/whichNavState';
import {useRecoilValue} from '../../state/atom';
import {navigationState} from '../../atoms/navigationState';
import {Navigation, WhichNav} from '../../config/types/navigation';
import ClearInputSVG from '../../assets/images/clearInput.svg';
import {TranslationKey} from '../../config/language';
import {useTranslation} from '../../hooks/useTranslation';

const placeholderKey: Record<WhichNav, TranslationKey> = {
  start: 'place.startSearch',
  end: 'place.endSearch',
  editWayPoint1: 'place.waypointSearch',
  editWayPoint2: 'place.waypointSearch',
  newWayPoint: 'place.waypointSearch',
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
  const {t} = useTranslation();
  const whichNav = useRecoilValue(whichNavState);
  const nav = useRecoilValue(navigationState);
  const [query, setQuery] = useState<string>(initialQuery(whichNav, nav) ?? '');

  return (
    <View style={{flex: 1, minWidth: 0, paddingRight: 20}}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => handleSubmit(query)}
        placeholder={t(placeholderKey[whichNav])}
        style={{
          width: '100%',
          height: 40,
          marginBottom: 2,
          paddingHorizontal: 12,
          paddingRight: 36,
          borderRadius: 2,
          backgroundColor: '#F2F2F2',
          color: '#000000',
        }}
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
