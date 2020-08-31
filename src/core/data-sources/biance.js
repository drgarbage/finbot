// const aggTradeRs = {
//   "e": "aggTrade",  // Event type
//   "E": 123456789,   // Event time
//   "s": "BNBBTC",    // Symbol
//   "a": 12345,       // Aggregate trade ID
//   "p": "0.001",     // Price
//   "q": "100",       // Quantity
//   "f": 100,         // First trade ID
//   "l": 105,         // Last trade ID
//   "T": 123456785,   // Trade time
//   "m": true,        // Is the buyer the market maker?
//   "M": true         // Ignore
// }

const updatePrice = (cache, price, amount) => {
  if(!cache[price])
    cache[price] = {price: 0, amount: 0, stamp: new Date()};
  let updateItem = cache[price];
  updateItem.price += parseFloat(price);
  updateItem.amount += parseFloat(amount);
  updateItem.stamp = new Date(); 
}

export const subscribe = ({symbol} , onUpdate) => {

  const streamName = symbol.toLowerCase().replace(':','');

  let socket = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);

  let lastUpdateId = null;
  let cachedUpdate = null;

  socket.onmessage = (event) => {
    let json = JSON.parse(event.data);

    if('result' in json) return;

    let updateId = json.u;

    if(updateId !== lastUpdateId) {
      console.log('updateId changed', cachedUpdate);
      if(cachedUpdate) onUpdate(cachedUpdate);
      cachedUpdate = {};
    }

    updatePrice(cachedUpdate, json.b, json.B);
    updatePrice(cachedUpdate, json.a, json.A);

    lastUpdateId = updateId;
  }

  socket.onopen = (event) => {
    console.log(`open stream: ${streamName}`);
    socket.send(JSON.stringify({
      "method": "SUBSCRIBE",
      "params": [
        `${streamName}@bookTicker`,
        // `${streamName}@depth`,
      ],
      "id": 1
      }));
  }

  socket.onclose = (event) => {
    console.log('ws closed');
  }

  socket.onerror = (event) => {
    console.log(event);
  }

}