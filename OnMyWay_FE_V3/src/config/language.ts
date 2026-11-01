import {NativeModules, Platform} from 'react-native';
import {
  translate,
  TranslationKey,
  TranslationValues,
} from '../i18n/dictionaries';

export type AppLanguage = 'ko' | 'en';
export {translate};
export type {TranslationKey, TranslationValues};

const getDeviceLocale = (): string => {
  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings;
    return settings?.AppleLanguages?.[0] ?? settings?.AppleLocale ?? '';
  }
  return NativeModules.I18nManager?.localeIdentifier ?? '';
};

export const getDeviceLanguage = (): AppLanguage =>
  getDeviceLocale().toLowerCase().startsWith('ko') ? 'ko' : 'en';

let requestLanguage: AppLanguage = getDeviceLanguage();

export const getRequestLanguage = (): AppLanguage => requestLanguage;

export const setRequestLanguage = (language: AppLanguage): void => {
  requestLanguage = language;
};

export const isAppLanguage = (value: unknown): value is AppLanguage =>
  value === 'ko' || value === 'en';
