export const roundToDp = (num: number, numOfDecimalPlaces: number) => {
  return Math.round(num * 10 ** numOfDecimalPlaces) / 10 ** numOfDecimalPlaces;
};
