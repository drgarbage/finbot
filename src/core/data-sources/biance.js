// deprecated

const API_BASE = 'https://www.binance.com/api/v3/';
const updatePrice = (cache, price, amount, type) => {
  if(!cache[price])
    cache[price] = {price: 0, amount: 0, stamp: new Date()};
  let updateItem = cache[price];
  updateItem.type = type;
  updateItem.price = parseFloat(price);
  updateItem.amount = parseFloat(amount) * ((type === 'ask') ? -1 : 1) ;
  updateItem.stamp = new Date().valueOf(); 
}

const bookParser = (json) => {
  let updateData = { id: json.u };
  updatePrice(updateData, json.b, json.B, 'bid');
  updatePrice(updateData, json.a, json.A, 'ask');
  return updateData;
}

const depthParser = (json) => {
  let updateData = { id: json.lastUpdateId };
  json.bids.forEach(pair => {
    updatePrice(updateData, pair[0], pair[1], 'bid');
  });
  json.asks.forEach(pair => {
    updatePrice(updateData, pair[0], pair[1], 'ask');
  });
  return updateData;
}

const loadSnapshot = async (symbol) => {
  try{
    let cors = 'https://cors-anywhere.herokuapp.com/'; // use cors-anywhere to fetch api data
    let url = `${cors}${API_BASE}depth?symbol=${symbol.toUpperCase()}&limit=1000`;
    let res = await fetch(url);
    let json = await res.json();
    let snapshot = depthParser(json);
    return snapshot;
  } catch (err) {
    console.log(err);
  }

  return {};
}

export const Channels = {
  '!bookTicker': bookParser,
  'bookTicker': bookParser,
  'depth5': depthParser,
  'depth10': depthParser,
  'depth20': depthParser,
  'depth5@100ms': depthParser,
  'depth10@100ms': depthParser,
  'depth20@100ms': depthParser,
  'depth5@1000ms': depthParser,
  'depth10@1000ms': depthParser,
  'depth20@1000ms': depthParser,
}

export const subscribe = async ({
    symbol, 
    channel = 'bookTicker'
  }, onUpdate) => {

  let lastUpdateId = null;
  let cachedUpdate = null;
  let streamName = symbol.toLowerCase().replace(':','');

  let snapshot = await loadSnapshot(streamName);
  lastUpdateId = snapshot.id;
  cachedUpdate = snapshot;
  onUpdate(snapshot);

  let socket = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);

  socket.onmessage = (event) => {
    let json = JSON.parse(event.data);

    if('result' in json) return;

    let updateData = Channels[channel](json);

    if(updateData.id < lastUpdateId) return;

    if(updateData.id !== lastUpdateId) {
      if(cachedUpdate) onUpdate(cachedUpdate);
      cachedUpdate = {};
    }

    cachedUpdate = {...cachedUpdate, ...updateData};

    lastUpdateId = updateData.id;
  }

  socket.onopen = (event) => {
    socket.send(JSON.stringify({
      "method": "SUBSCRIBE",
      "params": [
        `${streamName}@${channel}` // possible streams: @bookTicker @!bookTicker @depth5@100ms @depth10@100ms
      ],
      "id": 1
      }));
  }

  socket.onclose = (event) => {
    console.info('ws closed');
  }

  socket.onerror = (event) => {
    console.error(event);
  }

}