import React, {useState} from 'react';
import {
  Alert,
  Button,
  Linking,
  Platform,
  Text,
  TextInput,
  TextInputComponent,
  TouchableOpacity,
  View,
} from 'react-native';
import {login, logout, register} from '../../api/auth';
import {useRecoilState} from 'recoil';
import {userState} from '../../atoms/userState';
import ProfileSVG from '../../assets/images/profile.svg';

const DrawerView = () => {
  const [user, setUser] = useRecoilState(userState);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isLoggedin = user.isLoggedIn;
  return (
    <View className="w-full h-full bg-white items-center py-10">
      {isLoggedin ? (
        <>
          <Text className="text-2xl font-bold text-[#616060] mb-7">
            My Account
          </Text>
          <View className="w-4/5 flex-row justify-end pl-2">
            <ProfileSVG width={70} height={70} color={'black'} />
            <View className="flex-1 justify-center px-5 pb-2">
              <Text className="text-xl mt-1 mb-1">{user.username}</Text>
              <TouchableOpacity
                onPress={async () => {
                  const response = await logout();
                  console.log(response);
                  setUser({
                    isLoggedIn: false,
                    username: '',
                  });
                }}>
                <Text className="text-gray-400 text-sm font-semibold">
                  로그아웃
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <>
          <Text className="text-2xl font-bold text-[#616060]">Login</Text>
          <TextInput
            value={username}
            className={'mt-7 w-4/5 px-4 py-2 rounded-full bg-gray-200'}
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            onChangeText={text => setUsername(text)}
          />
          <TextInput
            value={password}
            className={'mt-4 w-4/5 px-4 py-2 rounded-full bg-gray-200'}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            secureTextEntry
            onChangeText={text => setPassword(text)}
          />
          <TouchableOpacity
            className="bg-[#2D7FF9] rounded-2xl w-4/5 justify-center items-center mt-7 py-1.5"
            onPress={async () => {
              const response = await login({
                username,
                password,
              });
              if (response) {
                setUser({
                  isLoggedIn: true,
                  username,
                });
                Alert.alert(`로그인 성공`, `성공적으로 로그인 되었습니다.`);
              }
              setUsername('');
              setPassword('');
            }}
            disabled={username.length === 0 || password.length === 0}>
            <Text className="text-[#FFFFFF] text-xl font-bold">로그인</Text>
          </TouchableOpacity>
          <View className="w-4/5 mt-4 flex-row justify-around items-center py-1">
            <Text className="text-[#616060]">아직 회원이 아니신가요?</Text>
            <TouchableOpacity
              onPress={async () => {
                const response = await register({
                  username,
                  password,
                });
                if (response) {
                  setUsername('');
                  setPassword('');
                }
                console.log(response);
              }}
              disabled={username.length === 0 || password.length === 0}>
              <Text className="text-[#2D7FF9] text-base font-semibold">
                가입하기
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default DrawerView;
