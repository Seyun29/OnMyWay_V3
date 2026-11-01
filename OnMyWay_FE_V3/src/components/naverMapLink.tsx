import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NaverLogo from '../assets/images/naverLogo.svg';
import {STORE_URL} from '../config/consts/link';
import {useRecoilValue} from '../state/atom';
import {Navigation} from '../config/types/navigation';
import {navigationState} from '../atoms/navigationState';
import {PlaceDetail} from '../config/types/coordinate';
import {curPlaceState} from '../atoms/curPlaceState';
import {createURLScheme, StopByStrategy} from '../config/helpers/nmapLink';
import {createGoogleMapsDirectionsUrl} from '../config/helpers/googleMapLink';
import {routeTouchesSouthKorea} from '../config/helpers/routeRegion';
import {useTranslation} from '../hooks/useTranslation';

type Props = {
  stopByStrategy: StopByStrategy;
  avoidTolls?: boolean;
};

const buttonShadow = {
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 2},
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

const NaverMapLink = ({stopByStrategy, avoidTolls = false}: Props) => {
  const {t} = useTranslation();
  const nav = useRecoilValue<Navigation>(navigationState);
  const curPlace = useRecoilValue<PlaceDetail | null>(curPlaceState);
  const isDomesticRoute = routeTouchesSouthKorea(
    [
      nav.start?.coordinate,
      ...nav.wayPoints.map(wayPoint => wayPoint.coordinate),
      curPlace?.coordinate,
      nav.end?.coordinate,
    ].filter(coordinate => coordinate !== undefined),
  );

  const hasRouteContext = () => {
    if (nav.start && nav.end && curPlace) return true;
    Alert.alert(t('common.notice'), t('navigation.temporaryError'));
    return false;
  };

  const openNaverMap = async () => {
    if (!hasRouteContext() || !nav.start || !nav.end || !curPlace) return;

    const url = createURLScheme(
      nav.start,
      nav.end,
      nav.wayPoints,
      curPlace,
      stopByStrategy,
    );
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }

      Alert.alert(
        t('common.error'),
        t(
          Platform.OS === 'ios'
            ? 'navigation.naverMissingIos'
            : 'navigation.naverMissingAndroid',
        ),
        [
          {
            text: t('common.confirm'),
            onPress: () => Linking.openURL(STORE_URL),
          },
          {text: t('common.cancel'), style: 'cancel'},
        ],
      );
    } catch {
      Alert.alert(t('common.error'), t('navigation.temporaryError'));
    }
  };

  const openGoogleMaps = async () => {
    if (!hasRouteContext() || !nav.start || !nav.end || !curPlace) return;

    try {
      await Linking.openURL(
        createGoogleMapsDirectionsUrl(
          nav.start,
          nav.end,
          nav.wayPoints,
          curPlace,
          stopByStrategy,
          avoidTolls,
        ),
      );
    } catch {
      Alert.alert(t('common.error'), t('navigation.temporaryError'));
    }
  };

  return (
    <View style={styles.container}>
      {isDomesticRoute && (
        <TouchableOpacity
          style={[styles.button, styles.naverButton, buttonShadow]}
          onPress={openNaverMap}>
          <NaverLogo width={15} height={15} />
          <Text style={styles.naverText}>{t('navigation.naverStart')}</Text>
        </TouchableOpacity>
      )}
      {!isDomesticRoute && (
        <TouchableOpacity
          style={[styles.button, styles.googleButton, buttonShadow]}
          onPress={openGoogleMaps}>
          <View style={styles.googleLogo}>
            <Text style={styles.googleLogoText}>G</Text>
          </View>
          <Text style={styles.googleText}>{t('navigation.googleStart')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: 8,
    rowGap: 8,
  },
  button: {
    minWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  naverButton: {backgroundColor: '#57B04B'},
  googleButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DADCE0',
    backgroundColor: '#FFFFFF',
  },
  googleLogo: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: {color: '#4285F4', fontSize: 15, fontWeight: '700'},
  naverText: {marginLeft: 8, color: '#FFFFFF', fontSize: 12},
  googleText: {marginLeft: 8, color: '#3C4043', fontSize: 12},
});

export default NaverMapLink;
