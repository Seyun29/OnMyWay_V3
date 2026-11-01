import Geolocation from '@react-native-community/geolocation';
import {Coordinate} from '../types/coordinate';
import {Platform} from 'react-native';
import Toast from 'react-native-toast-message';
import {getRequestLanguage, translate} from '../language';

const fetchIpAndLocation = async () => {
  try {
    // Get the device's IP address
    const ipResponse = await fetch('https://api.ip.pe.kr/json/');
    const ipData = await ipResponse.json();
    const ip = ipData.ip;

    // Fetch location data based on the IP address
    const locResponse = await fetch(`https://ipinfo.io/${ip}/json`);
    const locData = await locResponse.json();

    return {
      latitude: parseFloat(locData.loc.split(',')[0]),
      longitude: parseFloat(locData.loc.split(',')[1]),
    };
  } catch {
    return false;
  }
};

export const getCurPosition = (
  initial?: boolean,
  topOffset?: number,
): Promise<Coordinate> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      info =>
        resolve({
          latitude: info.coords.latitude,
          longitude: info.coords.longitude,
        }),
      async error => {
        if (!initial && Platform.OS === 'android') {
          const locationByIp = await fetchIpAndLocation();
          if (locationByIp) {
            const language = getRequestLanguage();
            Toast.show({
              type: 'info',
              text1: translate(language, 'location.ipWarning'),
              text2: translate(language, 'location.ipWarningDetail'),
              position: 'top',
              topOffset: topOffset,
              visibilityTime: 2500,
              text1Style: {
                fontSize: 12,
                fontWeight: '600',
              },
            });
            resolve(locationByIp);
            return;
          }
        }
        reject(error);
      },
      {
        enableHighAccuracy: Platform.OS === 'ios',
        timeout: 3500,
        maximumAge: 20000,
      },
    );
  });
};
