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
      if(cachedUpdate) onUpdate(cachedUpdate);
      cachedUpdate = {};
    }

    updatePrice(cachedUpdate, json.b, json.B);
    updatePrice(cachedUpdate, json.a, json.A);

    lastUpdateId = updateId;
  }

  socket.onopen = (event) => {
    socket.send(JSON.stringify({
      "method": "SUBSCRIBE",
      "params": [
        `${streamName}@bookTicker` // possible streams: @bookTicker @!bookTicker @depth5@100ms @depth10@100ms
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