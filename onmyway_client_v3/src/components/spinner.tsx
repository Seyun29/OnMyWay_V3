import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import Spinner1 from '../assets/images/spinners/spinner1.svg';
import Spinner2 from '../assets/images/spinners/spinner2.svg';
import Spinner3 from '../assets/images/spinners/spinner3.svg';
import Spinner4 from '../assets/images/spinners/spinner4.svg';
import Spinner5 from '../assets/images/spinners/spinner5.svg';
import Spinner6 from '../assets/images/spinners/spinner6.svg';
import Spinner7 from '../assets/images/spinners/spinner7.svg';

const spinners = [
  Spinner1,
  Spinner2,
  Spinner3,
  Spinner4,
  Spinner5,
  Spinner6,
  Spinner7,
];

export default function Spinner() {
  const [currentSpinner, setCurrentSpinner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSpinner(prevSpinner => (prevSpinner + 1) % spinners.length);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const SpinnerComponent = spinners[currentSpinner];

  return (
    <View className="flex-1 w-full h-full justify-center items-center bg-white">
      <SpinnerComponent className="w-16 h-16" />
    </View>
  );
}
