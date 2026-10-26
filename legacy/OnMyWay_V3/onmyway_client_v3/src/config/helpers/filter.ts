//@ts-nocheck
export const filterByOpen = result => {
  const filteredY = result.filter(item => item.open === 'Y');
  return filteredY;
  // const filteredElse = result.filter(item => item.open !== 'Y');
  // const filtered = filteredY.concat(filteredElse);
  // return filtered;
};

export const filterByParking = result => {
  const filteredY = result.filter(item => item.parking === 'Y');
  return filteredY;
};

export const sortByScore = result => {
  const sorted = [...result].sort((a, b) => {
    let aScore = a.scoreAvg;
    let bScore = b.scoreAvg;
    let aCnt = a.commentCnt;
    let bCnt = b.commentCnt;

    if (aScore === undefined) aScore = 0;
    if (bScore === undefined) bScore = 0;
    if (aCnt === undefined) aCnt = 0;
    if (bCnt === undefined) bCnt = 0;

    if (a) {
      if (aScore === bScore) return bCnt - aCnt;
      else return bScore - aScore;
    }
  });

  return sorted;
};

export const sortByReview = result => {
  const sorted = [...result].sort((a, b) => {
    let aCnt = a.commentCnt;
    let bCnt = b.commentCnt;
    let aScore = a.scoreAvg;
    let bScore = b.scoreAvg;

    if (aCnt === undefined) aCnt = 0;
    if (bCnt === undefined) bCnt = 0;
    if (aScore === undefined) aScore = 0;
    if (bScore === undefined) bScore = 0;

    if (aCnt === bCnt) return bScore - aScore;
    else return bCnt - aCnt;
  });
  return sorted;
};
