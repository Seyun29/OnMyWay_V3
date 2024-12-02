import React from 'react';
import CafeSVG from '../assets/images/category/cafe.svg';
import CVSSVG from '../assets/images/category/cvs.svg';
import FoodSVG from '../assets/images/category/food.svg';
import HospitalSVG from '../assets/images/category/hospital.svg';
import MartSVG from '../assets/images/category/mart.svg';
import ParkingSVG from '../assets/images/category/parking.svg';
import StaySVG from '../assets/images/category/stay.svg';

const CategorySVG = ({code}: {code: string}) => {
  switch (code) {
    case 'FD6':
      return <FoodSVG width={15} height={20} />;
    case 'CE7':
      return <CafeSVG width={15} height={20} />;
    case 'CS2':
      return <CVSSVG width={15} height={20} />;
    case 'MT1':
      return <MartSVG width={15} height={20} />;
    case 'PK6':
      return <ParkingSVG width={15} height={20} />;
    case 'AD5':
      return <StaySVG width={15} height={20} />;
    case 'HP8':
      return <HospitalSVG width={15} height={20} />;
    default:
      return <></>;
  }
};

export default CategorySVG;
