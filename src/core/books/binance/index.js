import {Book} from '../';
import {
  parseSymbol,
  parseDepth,
  parseDiffDepth,
  parseBookTicker,
  loadSnapshot,
  isBookDepthPayload,
  isDiffDepthPayload,
  isBookTickerPayload
} from './utils';

// How to manage a local order book correctly
// 1. Open a stream to wss://stream.binance.com:9443/ws/bnbbtc@depth.
// 2. Buffer the events you receive from the stream.
// 3. Get a depth snapshot from https://www.binance.com/api/v3/depth?symbol=BNBBTC&limit=5000 .
// 4. Drop any event where u is <= lastUpdateId in the snapshot.
// 5. The first processed event should have U <= lastUpdateId+1 AND u >= lastUpdateId+1.
// 6. While listening to the stream, each new event's U should be equal to the previous event's u+1.
// 7. The data in each event is the absolute quantity for a price level.
// 8. If the quantity is 0, remove the price level.
// 9. Receiving an event that removes a price level that is not in your local order book can happen and is normal.

export class BinanceBook extends Book {
  constructor(){
    super();
    this.socket = null;
    this.data = null;
  }
  async connect(symbol, channel = 'depth@100ms'){
    let streamName = parseSymbol(symbol);
    let url = `wss://stream.binance.com:9443/ws/${streamName}`;
    let requestId = new Date().valueOf();
    let cmd = {
      method: "SUBSCRIBE",
      params: [`${streamName}@${channel}`],
      id: requestId
    };
    
    const onResponse = (obj) => {
      if(obj.id !== requestId)
        return onError(new Error('Subscribtion Failed.'));
      console.info('Biance connected: ', symbol);
    }
    const onSnapshot = (obj) => {
      this.data = obj;
    }
    const onUpdate = (obj) => {
      if(!this.data) {
        this.data = obj;
        return;
      }

      if(obj.id < this.data.id)
        return;

      for(let price in obj.bids) {
        let data = obj.bids[price];
        if(data.amount === 0){
          delete this.data.bids[price];
          continue;
        }
        
        this.data.bids[price] = data;
      }

      for(let price in obj.asks) {
        let data = obj.asks[price];
        if(data.amount === 0){
          delete this.data.asks[price];
          continue;
        }
        
        this.data.asks[price] = data;
      }
    }
    const onError = (obj) => {}

    loadSnapshot(streamName)
      .then(parseDepth)
      .then(onSnapshot);

    let socket = new WebSocket(url);

    socket.onmessage = (event) => {
      let json = JSON.parse(event.data);
  
      if('result' in json) return onResponse(json);

      if(isBookDepthPayload(json)) 
        return onUpdate(parseDepth(json));
      
      if(isDiffDepthPayload(json))
        return onUpdate(parseDiffDepth(json));
      
      if(isBookTickerPayload(json))
        return onUpdate(parseBookTicker(json));

      // if reach end, means json format unsupported
      onError(new Error(
        `Unsupported json format. \n${event.data}`
        ));

    }
  
    socket.onopen = () => {
      socket.send(JSON.stringify(cmd));
    }
  
    socket.onclose = () => {
      this.socket = null;
      this.data = null;
    }

    this.socket = socket;

  }

  disconnect(){
    this.socket && this.socket.close();
  }

  snapshot(){
    return this.data || {};
  }
}