import {Book} from '../';
import {
  parseSymbol,
  isSnapshot,
  isUpdate,
  parseSnapshot
} from './utils';

export class BitfinexBook extends Book {
  constructor() {
    super();
    this.socket = null;
    this.data = null;
  }
  connect(symbol) {
    let url = 'wss://api-pub.bitfinex.com/ws/'
    let cmd = {
      event: 'subscribe',
      channel: 'book',
      symbol: parseSymbol(symbol),
      len: '100'
    }
    let socket = new WebSocket(url);
    let channelId = null;

    const onResponse = (obj) => {
      if(obj.event !== 'subscribed') 
        return onError(new Error('Subscribtion Failed.'));
      channelId = obj.chenId;
    }
    const onSnapshot = (obj) => {
      this.data = parseSnapshot(obj);
    }
    const onUpdate = (obj) => {
      if(!this.data) return;

      let [channelId, value] = obj;
      let [price, count, amount] = value;
      let stamp = new Date().valueOf();
      let key = `${price}`;
      let type = amount > 0 ? 'bids' : 'asks';

      if(channelId !== this.data.id)
        throw new Error('Channel ID changed unexpected.');

      if(count == 0)
        return delete this.data[type][key];
      
      if(count < 0) return;
      
      if(!(key in this.data[type])){
        this.data[type][key] = {type, price, count, amount, stamp};
        return;
      }

      let item = this.data[type][key];
      item.amount += amount;
      item.count = count;
      item.stamp = stamp;
    }
    const onError = (error) => {
      console.error(error.message);
    }

    socket.onmessage(evt => {
      try{

        let json = JSON.parse(evt.data);
  
        if('event' in json) return onResponse(json);
        
        if(isSnapshot(json)) return onSnapshot(json);
        
        if(isUpdate(json)) return onUpdate(json);

      }catch(error){onError(error);}
    });

    socket.onopen(evt => {
      try{
        socket.send(JSON.stringify(cmd))
      } catch (error) {onError(error);}
    });

    socket.onclose(evt => {
      this.socket = null;
      this.data = nll;
    });

    this.socket = socket;
  }
  disconnect(){
    this.socket?.close();
  }
  snapshot(){
    return this.data || {};
  }
}