/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import {Alert, Linking, Platform, UIManager} from 'react-native';
import 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';
import RootStackNavigation from './src/navigations';
import {RecoilRoot, useRecoilState} from 'recoil';
import Toast from 'react-native-toast-message';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import CodePush from 'react-native-code-push';
import DeviceInfo from 'react-native-device-info';
import {OMW_APPSTORE_URL, OMW_PLAYSTORE_URL} from './src/config/consts/link';
import {userState} from './src/atoms/userState';
import {login} from './src/api/auth';

function App(): React.JSX.Element {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hide();
    }, 2000);
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    //FIXME: react-native-device-info 사용은 1.0.5부터 적용필요 => pod install (ios), re build (android) required
    // console.log('App Version:', DeviceInfo.getVersion());
    // console.log('Latest Version:', '1.0.4');
    // if (DeviceInfo.getVersion() < '1.0.4') {
    //   //FIXME: see if it works practically
    //   Alert.alert(
    //     '새 버전이 출시되었습니다.',
    //     '새로운 기능 적용을 위해\n앱을 업데이트 해주세요.',
    //     [
    //       {
    //         text: '지금 업데이트',
    //         onPress: () => {
    //           if (Platform.OS === 'ios') Linking.openURL(OMW_APPSTORE_URL);
    //           else Linking.openURL(OMW_PLAYSTORE_URL);
    //         },
    //       },
    //       {
    //         text: '취소',
    //       },
    //     ],
    //   );
    // }
  }, []);

  return (
    <React.StrictMode>
      <RecoilRoot>
        <GestureHandlerRootView className="flex-1">
          <RootStackNavigation />
          <Toast />
        </GestureHandlerRootView>
      </RecoilRoot>
    </React.StrictMode>
  );
}

// deactivate codepush for V2 (temporary)
// export default CodePush(App);
export default App;
