export const parseSymbol = (symbol) =>
  symbol.toLowerCase().replace(':','');

export const parseDepth = (obj) => {
  let output = {id: obj.lastUpdateId, bids: {}, asks: {}};
  let stamp = new Date().valueOf();
  
  obj.bids.forEach(pair => {
    let [price, amount] = pair;
    output.bids[price] = {
      type: 'bids',
      price: parseFloat(price),
      amount: parseFloat(amount),
      stamp
    };
  });

  obj.asks.forEach(pair => {
    let [price, amount] = pair;
    output.asks[price] = {
      type: 'asks',
      price: parseFloat(price),
      amount: parseFloat(amount),
      stamp
    };
  });

  return output;
}

export const parseDiffDepth = (obj, lastUpdateId = 0) => {
  let output = {id:lastUpdateId, bids: {}, asks: {}};
  let idBegin = obj.U;
  let idEnd = obj.u;
}

export const parseBookTicker = (obj) => {
  let output = {id: obj.u, bids:{}, asks:{}};
  let stamp = new Date().valueOf();
  output.bids[obj.b] = {
    type: 'bids',
    price: parseFloat(obj.b),
    amount: parseFloat(obj.B),
    stamp
  };
  output.asks[obj.a] = {
    type: 'asks',
    price: parseFloat(obj.a),
    amount: parseFloat(obj.A),
    stamp
  }
  return output;
}

export const loadSnapshot = async (symbol) => {
  let cors = 'https://cors-anywhere.herokuapp.com/'; // use cors-anywhere to fetch api data
  let url = `${cors}${API_BASE}depth?symbol=${symbol.toUpperCase()}&limit=1000`;
  let res = await fetch(url);
  let json = await res.json();
  return json;
}

export const matchsMembers = (obj, members) => {
  for(let m of members)
    if(!(m in obj))
      return false;
  return true;
}

export const isBookTickerPayload = (obj) =>
  matchsMembers(obj, ['u','s','b','B','a','A']);

export const isBookDepthPayload = (obj) =>
  matchsMembers(obj, ['lastUpdateId', 'bids', 'asks']);

export const isDiffDepthPayload = (obj) =>
  matchsMembers(obj, ['e','E','s','U','u','b','a']);