const removeDuplicate = (arr: any[]) => {
  //address_name과 place_name이 같은 경우 중복으로 처리
  return arr.filter(
    (v, i, a) =>
      a.findIndex(
        (t) =>
          t.address_name === v.address_name && t.place_name === v.place_name,
      ) === i,
  );
};

export default removeDuplicate;
