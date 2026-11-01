import AsyncStorage from '@react-native-async-storage/async-storage';
import {favoritePlace, recentPlace} from '../types/place';

export const store = async <T>(key: string, value: T): Promise<void> => {
  try {
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch {
    // Storage failures are non-fatal; callers continue with in-memory state.
  }
};

export const get = async <T = recentPlace | favoritePlace>(
  key: string,
): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      // value previously stored
      return JSON.parse(value) as T;
    }
  } catch {
    // Storage failures are non-fatal; callers use an empty result.
  }
  return null;
};

export const remove = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Storage failures are non-fatal; callers continue with in-memory state.
  }
};
