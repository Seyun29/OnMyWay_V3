/**
 * @format
 */

import React, {type PropsWithChildren, useEffect, useState} from 'react';
import {Image, Platform, StyleSheet, UIManager} from 'react-native';
import 'react-native-gesture-handler';
import './global.css';
import BootSplash from 'react-native-bootsplash';
import RootStackNavigation from './src/navigations';
import {
  RecoilRoot,
  useRecoilState,
  useRecoilValue,
} from './src/state/atom';
import Toast from 'react-native-toast-message';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {languageState} from './src/atoms/languageState';
import {mapRendererState} from './src/atoms/mapRendererState';
import {LANGUAGE_KEY, MAP_RENDERER_KEY} from './src/config/consts/storage';
import {get, store} from './src/config/helpers/storage';
import {
  type AppLanguage,
  getDeviceLanguage,
  isAppLanguage,
  setRequestLanguage,
} from './src/config/language';
import {
  defaultRendererForLanguage,
  isMapRendererId,
  type MapRendererId,
} from './src/config/mapRenderer';

function LanguageInitializer({children}: PropsWithChildren) {
  const [, setLanguage] = useRecoilState(languageState);
  const [, setMapRenderer] = useRecoilState(mapRendererState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    BootSplash.hide({fade: true}).catch(() => undefined);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateLanguage = async () => {
      const storedLanguage = await get<AppLanguage>(LANGUAGE_KEY);
      const hasStoredLanguage = isAppLanguage(storedLanguage);
      const language = hasStoredLanguage ? storedLanguage : getDeviceLanguage();
      if (!hasStoredLanguage) await store(LANGUAGE_KEY, language);

      const storedRenderer = await get<MapRendererId>(MAP_RENDERER_KEY);
      const hasStoredRenderer = isMapRendererId(storedRenderer);
      const renderer = hasStoredRenderer
        ? storedRenderer
        : defaultRendererForLanguage(language);
      if (!hasStoredRenderer) await store(MAP_RENDERER_KEY, renderer);

      if (isMounted) {
        setRequestLanguage(language);
        setLanguage(language);
        setMapRenderer(renderer);
        setIsReady(true);
      }
    };

    hydrateLanguage().catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [setLanguage, setMapRenderer]);

  return isReady ? (
    <>{children}</>
  ) : (
    <Image
      source={require('./src/assets/images/splash.png')}
      style={styles.splash}
      resizeMode="cover"
    />
  );
}

function MapSessionBoundary() {
  const language = useRecoilValue(languageState);
  const mapRenderer = useRecoilValue(mapRendererState);
  return <RootStackNavigation key={`${language}-${mapRenderer}`} />;
}

function AppToast() {
  const insets = useSafeAreaInsets();
  return <Toast topOffset={insets.top + 10} />;
}

function App(): React.JSX.Element {
  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // RNGH 3.1.0의 GestureDetector는 내부 Wrap 인스턴스에 findNodeHandle을
  // 호출한다. React 19 StrictMode에서는 이 dependency 내부 호출이 매 렌더마다
  // console error가 되므로, upstream이 host ref 방식으로 전환될 때까지 앱 root에
  // StrictMode를 적용하지 않는다. 프로덕션 동작에는 StrictMode가 적용되지 않는다.
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <RecoilRoot>
          <LanguageInitializer>
            <MapSessionBoundary />
            <AppToast />
          </LanguageInitializer>
        </RecoilRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    width: '100%',
    height: '100%',
  },
});

export default App;
