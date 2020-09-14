export const decimalPlaces = (number) => {
  // toFixed produces a fixed representation accurate to 20 decimal places
  // without an exponent.
  // The ^-?\d*\. strips off any sign, integer portion, and decimal point
  // leaving only the decimal fraction.
  // The 0+$ strips off any trailing zeroes.
  // return ((+number).toFixed(20)).replace(/^-?\d*\.?|0+$/g, '').length;
  return ((+number).toFixed(15)).replace(/^-?\d*\.?|0+$/g, '').length;
}

export const crosFetch = (url, options = {}) => {
  // let cors = 'https://cors-anywhere.herokuapp.com/';
  let cors = 'http://localhost:3001/';
  return fetch(`${cors}${url}`, options);
}