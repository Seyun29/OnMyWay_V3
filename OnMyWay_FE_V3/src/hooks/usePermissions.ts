import {Alert, Linking, Platform} from 'react-native';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {getRequestLanguage, translate} from '../config/language';

export const checkPermissions = async () => {
  const language = getRequestLanguage();
  let returnVal = false;
  if (Platform.OS === 'android') {
    try {
      const result = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
        Alert.alert(
          translate(language, 'location.permissionTitle'),
          translate(language, 'location.permissionAndroid'),
          [
            {
              text: translate(language, 'common.yes'),
              onPress: () => Linking.openSettings(),
            },
            {
              text: translate(language, 'common.no'),
              style: 'cancel',
            },
          ],
        );
        returnVal = true;
      }
    } catch {
      // A failed permission check is treated as unavailable.
    }
  } else if (Platform.OS === 'ios') {
    try {
      const result = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
      if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
        const whenInUseResult = await check(
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        );
        if (
          whenInUseResult === RESULTS.BLOCKED ||
          whenInUseResult === RESULTS.DENIED
        ) {
          Alert.alert(
            translate(language, 'location.permissionTitle'),
            translate(language, 'location.permissionIos'),
            [
              {
                text: translate(language, 'common.yes'),
                onPress: () => Linking.openSettings(),
              },
              {
                text: translate(language, 'common.no'),
                style: 'cancel',
              },
            ],
          );
          returnVal = true;
        }
      }
    } catch {
      // A failed permission check is treated as unavailable.
    }
  }
  return returnVal;
};
