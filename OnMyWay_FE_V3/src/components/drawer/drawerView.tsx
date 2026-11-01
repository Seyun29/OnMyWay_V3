import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {APP_NAME} from '@env';
import {useRecoilState} from '../../state/atom';
import Toast from 'react-native-toast-message';
import {languageState} from '../../atoms/languageState';
import {mapRendererState} from '../../atoms/mapRendererState';
import {LANGUAGE_KEY, MAP_RENDERER_KEY} from '../../config/consts/storage';
import {store} from '../../config/helpers/storage';
import {
  AppLanguage,
  setRequestLanguage,
  translate,
} from '../../config/language';
import {
  defaultRendererForLanguage,
  MapRendererId,
} from '../../config/mapRenderer';
import {useTranslation} from '../../hooks/useTranslation';
import {useResetMapSession} from '../../hooks/useResetMapSession';

const DrawerView = () => {
  const [language, setLanguage] = useRecoilState(languageState);
  const [mapRenderer, setMapRenderer] = useRecoilState(mapRendererState);
  const {t} = useTranslation();
  const resetMapSession = useResetMapSession();

  const selectLanguage = (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) return;

    // 수동 언어 변경 시 renderer는 언어 기본값으로 되돌리고 두 선택을 저장한다.
    const nextRenderer = defaultRendererForLanguage(nextLanguage);
    store(LANGUAGE_KEY, nextLanguage);
    store(MAP_RENDERER_KEY, nextRenderer);
    setRequestLanguage(nextLanguage);
    resetMapSession();
    setLanguage(nextLanguage);
    setMapRenderer(nextRenderer);
    Toast.show({
      type: 'info',
      text1: translate(
        nextLanguage,
        nextLanguage === 'ko' ? 'drawer.toastKakao' : 'drawer.toastGoogle',
      ),
      text2: translate(
        nextLanguage,
        nextRenderer === 'NAVER'
          ? 'drawer.toastRendererDomestic'
          : 'drawer.toastRendererGoogle',
      ),
      position: 'top',
      visibilityTime: 2500,
    });
  };

  const selectMapRenderer = (nextRenderer: MapRendererId) => {
    if (nextRenderer === mapRenderer) return;

    store(MAP_RENDERER_KEY, nextRenderer);
    resetMapSession();
    setMapRenderer(nextRenderer);
    Toast.show({
      type: 'info',
      text1: t(
        nextRenderer === 'NAVER'
          ? 'drawer.toastRendererDomestic'
          : 'drawer.toastRendererGoogle',
      ),
      position: 'top',
      visibilityTime: 2000,
    });
  };

  return (
    <View className="w-full h-full bg-white items-center py-10">
      <Text className="text-2xl font-bold text-[#616060] mb-7">
        {APP_NAME || 'OnMyWay'}
      </Text>
      <View className="w-4/5 mt-8">
        <Text className="text-sm font-bold text-[#616060] mb-3">
          {t('drawer.language')}
        </Text>
        <View className="flex-row bg-[#F1F3F5] rounded-xl p-1">
          {(['ko', 'en'] as AppLanguage[]).map(item => {
            const isSelected = language === item;
            return (
              <TouchableOpacity
                key={item}
                accessibilityRole="button"
                accessibilityState={{selected: isSelected}}
                className="flex-1 py-2 rounded-lg items-center"
                style={{backgroundColor: isSelected ? '#FFFFFF' : '#F1F3F5'}}
                onPress={() => selectLanguage(item)}>
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-[#2D7FF9]' : 'text-[#616060]'
                  }`}>
                  {t(item === 'ko' ? 'drawer.korean' : 'drawer.english')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-sm font-bold text-[#616060] mb-3 mt-6">
          {t('drawer.mapSetting')}
        </Text>
        <View className="flex-row bg-[#F1F3F5] rounded-xl p-1">
          {(['NAVER', 'GOOGLE'] as MapRendererId[]).map(item => {
            const isSelected = mapRenderer === item;
            return (
              <TouchableOpacity
                key={item}
                accessibilityRole="button"
                accessibilityState={{selected: isSelected}}
                className="flex-1 py-2 rounded-lg items-center"
                style={{backgroundColor: isSelected ? '#FFFFFF' : '#F1F3F5'}}
                onPress={() => selectMapRenderer(item)}>
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-[#2D7FF9]' : 'text-[#616060]'
                  }`}>
                  {t(
                    item === 'NAVER'
                      ? 'drawer.mapDomestic'
                      : 'drawer.mapGoogle',
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-3 rounded-xl bg-[#EBF2FF] px-3 py-3">
          <Text className="text-xs font-semibold text-[#2D7FF9]">
            {t(
              language === 'ko'
                ? 'drawer.providerKakao'
                : 'drawer.providerGoogle',
            )}
          </Text>
          <Text className="text-[11px] text-[#616060] mt-1">
            {t(
              mapRenderer === 'NAVER'
                ? 'drawer.rendererNaver'
                : 'drawer.rendererGoogle',
            )}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DrawerView;
