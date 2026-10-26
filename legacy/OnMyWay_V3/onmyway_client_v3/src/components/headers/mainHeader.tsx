import React, {useEffect} from 'react';
import {
  Pressable,
  View,
  LayoutAnimation,
  Text,
  TouchableOpacity,
} from 'react-native';
import AddStopOverSVG from '../../assets/images/addStopOver.svg';
import ChangeDirectionSVG from '../../assets/images/changeDirection.svg';
import RemoveStopoOverSVG from '../../assets/images/removeStopOver.svg';
import HeaderLogoSVG from '../../assets/images/headerLogo.svg';
import MenuIconSVG from '../../assets/images/menuIcon.svg';
import {HEADER_LOGO_HEIGHT} from '../../config/consts/style';
import {headerRoughState} from '../../atoms/headerRoughState';
import {useRecoilState, useRecoilValue} from 'recoil';
import {drawerState} from '../../atoms/drawerState';
import {navigationState} from '../../atoms/navigationState';
import InputBox from './inputBox';
import RightArrow from '../../assets/images/rightArrow.svg';
import useNavReverse from '../../hooks/useNavReverse';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParam} from '../../navigations';
import {whichNavState} from '../../atoms/whichNavState';
import {WhichNav} from '../../config/types/navigation';
import CancelSVG from '../../assets/images/cancel.svg';
import {loadingState} from '../../atoms/loadingState';
import {headerHeightState} from '../../atoms/headerHeightState';

export default function MainHeader({
  setSelectedRoute,
}: {
  setSelectedRoute: any;
}) {
  //FIXME: utilize components outside
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParam>>();
  const reverseNav = useNavReverse();
  const [nav, setNav] = useRecoilState(navigationState);
  const [, setWhichNav] = useRecoilState<WhichNav>(whichNavState);
  const [isRough, setIsRough] = useRecoilState<boolean>(headerRoughState);
  const [isDrawerOpen, setIsDrawerOpen] = useRecoilState<boolean>(drawerState);
  const [headerHeight, setHeaderHeight] =
    useRecoilState<number>(headerHeightState);
  const isLoading = useRecoilValue<boolean>(loadingState);

  const textSize =
    (nav.start && nav.start.name.length > 12) ||
    (nav.end && nav.end.name.length > 12)
      ? 'text-xs'
      : 'text-sm';

  const removeWayPoint = (idx: number) => {
    setNav(prev => {
      const newWayPoints = [...prev.wayPoints];
      newWayPoints.splice(idx, 1);
      return {...prev, wayPoints: newWayPoints};
    });
  };

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isRough]);

  return (
    <View
      style={{
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      }}
      onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
      className="bg-white w-full justify-start items-start px-[16px] pt-[16px] pb-[13px] gap-y-[13px]">
      <View className={'w-full flex-row align-center justify-between'}>
        <Pressable onPress={() => setIsDrawerOpen(!isDrawerOpen)}>
          <MenuIconSVG height={HEADER_LOGO_HEIGHT} width={HEADER_LOGO_HEIGHT} />
        </Pressable>
        <HeaderLogoSVG height={HEADER_LOGO_HEIGHT} />
        {nav.start || nav.end || nav.wayPoints.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setNav({
                start: null,
                wayPoints: [],
                end: null,
              });
              setSelectedRoute(null);
            }}
            disabled={isLoading}>
            <CancelSVG width={25} height={25} />
          </TouchableOpacity>
        ) : (
          <View style={{width: 25, height: 25}} />
        )}
      </View>
      <View className="relative flex-row items-center justify-between">
        <View className="flex-col flex-1 pr-[10px]">
          {isRough && nav.start && nav.end ? (
            <InputBox
              children={
                <View className="flex-1 flex-row justify-around items-center overflow-hidden">
                  <Text className={textSize}>
                    {nav.start.name.length > 12
                      ? nav.start.name.slice(0, 12) + '...'
                      : nav.start.name}
                  </Text>
                  <RightArrow height={'15px'} width={'15px'} />
                  <Text className={textSize}>
                    {nav.end.name.length > 12
                      ? nav.end.name.slice(0, 12) + '...'
                      : nav.end.name}
                  </Text>
                </View>
              }
              onPress={() => {
                setIsRough(false);
              }}
            />
          ) : (
            <>
              {nav.wayPoints.length === 0 && (
                <TouchableOpacity
                  className="absolute z-10 right-[20px] top-0 transform translate-y-[29px] bg-white h-[26px] w-[26px] rounded-[100px] shadow-md items-center justify-center"
                  onPress={() => {
                    setWhichNav('newWayPoint');
                    navigation.navigate('PlaceInput');
                  }}
                  disabled={isLoading}>
                  <AddStopOverSVG height={'18px'} width={'18px'} />
                </TouchableOpacity>
              )}
              <InputBox
                text={nav.start?.name}
                altText={'출발지 입력'}
                onPress={() => {
                  setWhichNav('start');
                  navigation.navigate('PlaceInput');
                }}
              />
              {nav.wayPoints.map((wayPoint, idx) => (
                <InputBox
                  key={idx}
                  text={wayPoint?.name}
                  altText={'경유지 입력'}
                  onPress={() => {
                    //@ts-ignore FIXME: type issue
                    setWhichNav(`editWayPoint${idx + 1}`);
                    navigation.navigate('PlaceInput');
                  }}
                  children={
                    <TouchableOpacity
                      className="absolute z-10 right-[15px] bg-white h-[26px] w-[26px] rounded-[100px] shadow-md items-center justify-center"
                      onPress={() => {
                        removeWayPoint(idx);
                      }}
                      disabled={isLoading}>
                      <RemoveStopoOverSVG height={'20px'} width={'20px'} />
                    </TouchableOpacity>
                  }
                />
              ))}
              <InputBox
                text={nav.end?.name}
                altText={'도착지 입력'}
                onPress={() => {
                  setWhichNav('end');
                  navigation.navigate('PlaceInput');
                }}
                children={
                  nav.wayPoints.length === 1 && (
                    <TouchableOpacity
                      className="absolute z-10 right-[15px] bg-white h-[26px] w-[26px] rounded-[100px] shadow-md items-center justify-center"
                      onPress={() => {
                        setWhichNav('newWayPoint');
                        navigation.navigate('PlaceInput');
                      }}
                      disabled={isLoading}>
                      <AddStopOverSVG height={'18px'} width={'18px'} />
                    </TouchableOpacity>
                  )
                }
              />
            </>
          )}
        </View>
        <TouchableOpacity onPress={reverseNav} disabled={isLoading}>
          <ChangeDirectionSVG height={'24px'} width={'24px'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
