import AsyncStorage from '@react-native-async-storage/async-storage';
import {favoritePlace, recentPlace} from '../types/place';

export const store = async (
  key: string,
  value: recentPlace | favoritePlace,
) => {
  try {
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (e) {
    // saving error
    console.log('error while saving:', e);
  }
};

export const get = async (
  key: string,
): Promise<recentPlace | favoritePlace | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      // value previously stored
      return JSON.parse(value);
    }
  } catch (e) {
    // error reading value
    console.log('error while reading:', e);
  }
  return null;
};

export const remove = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    // Successfully removed
  } catch (e) {
    // error removing value
    console.log('error while removing:', e);
  }
};
