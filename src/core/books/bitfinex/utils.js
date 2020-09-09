const SymbolMapping = {
  'BTC:USD': 'tBTCUSD',
  'BTC:USDT': 'tBTCUST',
  'ETH:USD': 'tETHUSD',
  'ETH:USDT': 'tETHUST',
}

export const parseSymbol = (symbol) => {
  if(!(symbol in SymbolMapping))
    throw new Error("Symbol Not Supported.");

  return SymbolMapping[symbol];
}

export const isSnapshot = (obj) =>
  Array.isArray(obj) && 
  Array.isArray(obj[1]) && 
  Array.isArray(obj[1][0]);

export const isUpdate = (obj) =>
  Array.isArray(obj) && 
  Array.isArray(obj[1]) && 
  typeof obj[1][0] == 'number';

export const parseSnapshot = (obj) => {
  let [channelId, values] = obj;
  let output = {id: channelId, bids:{},asks:{}};
  let stamp = new Date().valueOf();
  values.forEach(value => {
    let [price, count, amount] = value;
    let key = `${price}`;
    let type = amount > 0 ? 'bids' : 'asks';
    output[type][key] = {
      type, price, count, amount, stamp
    };
  });
  return output;
}