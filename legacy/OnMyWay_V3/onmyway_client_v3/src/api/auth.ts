import {Alert} from 'react-native';
import {get, remove, store} from '../config/helpers/storage';
import {axiosDefault, axiosInstance} from './axios';

export const login = async (params: {username: string; password: string}) => {
  try {
    // FormData 객체 생성
    const formData = new FormData();
    // params 객체의 각 키와 값을 FormData에 추가
    formData.append('username', params.username);
    formData.append('password', params.password);

    // axios 요청 시 FormData 사용
    const response = await axiosDefault.post('/user/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const accessToken = response.headers.accesstoken;
    const refreshToken = response.headers.refreshtoken;
    await store('accessToken', accessToken);
    await store('refreshToken', refreshToken);
    await store('username', params.username as any);
    if (response.status >= 200 && response.status < 300) {
      return true;
    } else return false;
  } catch (err) {
    console.log('login error, Params: ', params);
    Alert.alert('로그인 실패', '아이디와 비밀번호를 확인해주세요');
    return false;
  }
};

export const register = async (params: {
  username: string;
  password: string;
}) => {
  //FIXME: fixme
  try {
    const response = await axiosDefault.post('/user/register', params);
    //FIXME: status code로 분기
    if (response.status >= 200 && response.status < 300) {
      Alert.alert('회원가입 성공', '로그인 해주세요');
      return true;
    } else return false;
  } catch (err) {
    console.log('register error, Params: ', params);
    Alert.alert('회원가입 실패', '다른 아이디를 사용해주세요');
  }
};

export const refresh = async () => {
  try {
    const refreshToken = await get('refreshToken');
    const response = await axiosDefault.post('/auth/refresh', {
      refreshToken,
    });
    //FIXME: add new accesstoken and refreshtoken to asyncstorage here

    return response.data;
  } catch (err) {
    console.log('error while refreshing token');
  }
};

export const logout = async () => {
  try {
    const refreshToken = await get('refreshToken');
    console.log(refreshToken);
    const response = await axiosDefault.post(
      '/user/logout',
      {},
      {
        headers: {
          refreshToken: refreshToken as any,
        },
      },
    );
    //FIXME: remove accesstoken and refreshtoken from asyncstorage here
    remove('accessToken');
    remove('refreshToken');
    remove('username');
    Alert.alert('로그아웃', '로그아웃 되었습니다');
    if (response.status == 200) {
      return true;
    }
  } catch (err) {
    console.log('error while logging out');
    return false;
  }
};
