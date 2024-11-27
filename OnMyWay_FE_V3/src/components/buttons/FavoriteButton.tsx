import React, {useEffect, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import FavoriteFilledSVG from '../../assets/images/favoriteFilled.svg';
import FavoriteNotFilledSVG from '../../assets/images/favoriteNotFilled.svg';
import {FAVORITE_KEY} from '../../config/consts/storage';
import {get, store} from '../../config/helpers/storage';
import {Coordinate} from '../../config/types/coordinate';

export default function FavoriteButton({
  placeName,
  roadAddressName,
  addressName,
  coordinate,
}: {
  placeName?: string;
  roadAddressName?: string;
  addressName: string;
  coordinate: Coordinate;
}) {
  const [isFav, setIsFav] = useState<boolean>(false);
  const onUseEffect = async () => {
    const res = await get(FAVORITE_KEY);
    if (res) {
      res.places.forEach((item, idx) => {
        if (item.addressName === addressName) {
          setIsFav(true);
        }
      });
    }
  };

  useEffect(() => {
    onUseEffect();
  }, [addressName]);

  const handlePress = async () => {
    if (isFav) {
      //delete from favorite
      const favorites = await get(FAVORITE_KEY);
      const newFavorites = favorites?.places.filter(
        item => item.addressName !== addressName,
      );
      await store(FAVORITE_KEY, {places: newFavorites || []});
      setIsFav(false);
    } else {
      const favorites = await get(FAVORITE_KEY);
      const newFavorite = {
        placeName,
        roadAddressName,
        addressName,
        coordinate,
      };
      if (favorites)
        await store(FAVORITE_KEY, {
          places: [newFavorite, ...favorites.places],
        });
      else await store(FAVORITE_KEY, {places: [newFavorite]});
      setIsFav(true);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        handlePress();
      }}>
      {isFav ? (
        <FavoriteFilledSVG width={32} height={32} />
      ) : (
        <FavoriteNotFilledSVG width={32} height={32} />
      )}
    </TouchableOpacity>
  );
}
