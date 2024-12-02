import Geolocation from '@react-native-community/geolocation';
import {Coordinate} from '../types/coordinate';
import {Platform} from 'react-native';
import Toast from 'react-native-toast-message';

const fetchIpAndLocation = async () => {
  try {
    // Get the device's IP address
    const ipResponse = await fetch(`https://api.ip.pe.kr/json/`);
    const ipData = await ipResponse.json();
    const ip = ipData.ip;

    // Fetch location data based on the IP address
    const locResponse = await fetch(`https://ipinfo.io/${ip}/json`);
    const locData = await locResponse.json();

    return {
      latitude: parseFloat(locData.loc.split(',')[0]),
      longitude: parseFloat(locData.loc.split(',')[1]),
    };
  } catch (error) {
    console.error('Error fetching IP address or location:', error);
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
        console.error(error);
        //FIXME: 안드로이드 위치 문제 해결 ㅠㅠ
        if (!initial && Platform.OS === 'android') {
          const locationByIp = await fetchIpAndLocation();
          if (locationByIp) {
            Toast.show({
              type: 'info',
              text1: '위치 정보가 정확하지 않을 수 있습니다.',
              text2:
                '일부 안드로이드 앱에서 발생하는 현상입니다. 양해 부탁드립니다.',
              position: 'top',
              topOffset: topOffset,
              visibilityTime: 2500,
              text1Style: {
                fontSize: 12,
                fontWeight: '600',
              },
            });
            resolve(locationByIp);
          } else reject(error);
        }
        reject(error);
      },
      {
        enableHighAccuracy: Platform.OS === 'ios' ? true : false, //FIXME: fixme..
        timeout: 3500,
        maximumAge: 20000,
      },
    );
  });
};
