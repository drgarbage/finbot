export const parseSymbol = (symbol) =>
  `${symbol.toUpperCase().replace(':','-')}`;

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