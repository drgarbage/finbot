const Symbols = {
  "BTC:USD": "btcusdt", // usd not support
  "BTC:USDT": "btcusdt",
  "ETH:USD": "ethusdt", // usd not support
  "ETH:USDT": "ethusdt",
}

export const parseSymbol = (symbol) =>{
  if(!(symbol in Symbols)) throw new Error("Symbol not supported.");
  return Symbols[symbol];
}

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
      amount: -parseFloat(amount),
      stamp
    };
  });

  return output;
}

export const parseDiffDepth = (obj) => {
  let output = {id:obj.U, bids: {}, asks: {}};
  // let idBegin = obj.U;
  // let idEnd = obj.u;
  let stamp = new Date().valueOf();

  obj.b.forEach(pair => {
    let [price, amount] = pair;
    output.bids[price] = {
      type: 'bids',
      price: parseFloat(price),
      amount: parseFloat(amount),
      stamp
    }
  });

  obj.a.forEach(pair => {
    let [price, amount] = pair;
    output.asks[price] = {
      type: 'asks',
      price: parseFloat(price),
      amount: -parseFloat(amount),
      stamp
    }
  });
  
  return output;
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
    amount: -parseFloat(obj.A),
    stamp
  }
  return output;
}

export const loadSnapshot = async (symbol) => {
  let cors = 'https://cors-anywhere.herokuapp.com/'; // use cors-anywhere to fetch api data
  let url = `${cors}https://www.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=1000`;
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