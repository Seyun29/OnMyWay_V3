import React from 'react';
import {TouchableOpacity} from 'react-native';
import CurPosButtonSVG from '../../assets/images/curPosButton.svg';

export default function CurPosButton({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: string | null;
}) {
  return (
    <TouchableOpacity
      className={style || 'absolute right-2.5 bottom-2.5'}
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
      onPress={onPress}
      activeOpacity={0.2}>
      <CurPosButtonSVG height="45px" width="45px" />
    </TouchableOpacity>
  );
}
