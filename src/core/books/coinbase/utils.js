const SymbolMapping = {
  'BTC:USD': 'BTC-USD',
  'BTC:USDT': 'BTC-USD', // usdt not support
  'ETH:USD': 'ETH-USD',
  'ETH:USDT': 'ETH-USD', // usdt not support
}

export const parseSymbol = (symbol) => {
  if(!(SymbolMapping[symbol]))
    throw new Error("Symbol Not Supported.");

  return SymbolMapping[symbol];
}

export const parseSnapshot = (obj) => {
  let output = {id:obj.sequence, bids: {}, asks: {}};
  let stamp = new Date().valueOf();
  obj.bids.forEach(value => {
    let [price, amount] = value; // [price, count, signature]
    output.bids[price] = {
      type: 'bids',
      price: parseFloat(price),
      amount: parseFloat(amount),
      stamp
    };
  });
  obj.asks.forEach(value => {
    let [price, amount] = value; // [price, count, signature]
    output.asks[price] = {
      type: 'asks',
      price: parseFloat(price),
      amount: -parseFloat(amount),
      stamp
    };
  });
  return output;
}