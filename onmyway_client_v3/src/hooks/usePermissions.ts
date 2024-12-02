import {useEffect} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';

export const checkPermissions = async () => {
  let returnVal = false;
  if (Platform.OS === 'android') {
    try {
      const result = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
        Alert.alert(
          '현위치 확인을 위해 위치 권한이 필요합니다.',
          '앱 설정 화면을 열어서 허용으로 변경해주세요.',
          [
            {
              text: '네',
              onPress: () => Linking.openSettings(),
            },
            {
              text: '아니오',
              // onPress: () => console.log('No Pressed'),
              style: 'cancel',
            },
          ],
        );
        returnVal = true;
      }
    } catch (error) {
      console.error(error);
    }
  } else if (Platform.OS === 'ios') {
    try {
      const result = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
      if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
        const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
          Alert.alert(
            '현위치 확인을 위해 위치 권한이 필요합니다.',
            '현재 위치 확인을 위해\n설정에서 위치 권한을 허용해주세요.',
            [
              {
                text: '네',
                onPress: () => Linking.openSettings(),
              },
              {
                text: '아니오',
                style: 'cancel',
              },
            ],
          );
          returnVal = true;
        }
      }
    } catch (error) {
      console.error('checkPermission error:', error);
    }
  }
  return returnVal;
};

function usePermissions() {
  useEffect(() => {
    (async () => {
      await checkPermissions();
    })();
  }, []);
}

export default usePermissions;
