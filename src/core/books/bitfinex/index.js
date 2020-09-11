import {Book} from '../';
import { crosFetch } from '../../utils';
import {
  parseSymbol,
  isSnapshot,
  isUpdate,
  parseSnapshot
} from './utils';

const SNAPSHOT_INTERVAL = 10000;

export class BitfinexBook extends Book {
  constructor() {
    super();
    this.socket = null;
    this.data = null;
    this.refresh = null;
  }
  name(){return 'Bitfinex';}
  connect(symbol) {
    if(this.socket) return;
    let url = 'wss://api-pub.bitfinex.com/ws/2'
    let snapshotUrl = 'https://api-pub.bitfinex.com/v2/book/tBTCUSD/P0?_full=1';
    let cmd = {
      event: 'subscribe',
      channel: 'book',
      symbol: parseSymbol(symbol),
      len: '100'
    }
    let channelId = null;


    const onResponse = (obj) => {
      // if(obj.event !== 'subscribed') 
      //   return onError(new Error('Subscribtion Failed.'));
      if(obj.chanId)
        channelId = obj.chanId;
      console.info('Bitfinex connected: ', symbol);
    }
    const onSnapshot = (obj) => {
      this.data = parseSnapshot(obj);
    }
    const onUpdate = (obj) => {
      if(!this.data) return;

      let [chanId, value] = obj;
      let [price, count, amount] = value;
      let stamp = new Date().valueOf();
      let key = `${price}`;
      let type = amount < 0 ? 'asks' : 'bids';

      // if(chanId !== channelId)
      //   this.data = {id: chanId, bids: {}, asks: {}};

      if(count <= 0)
        return delete this.data[type][key];
      
      if(!(key in this.data[type])){
        this.data[type][key] = {type, price, count, amount, stamp};
        return;
      }

      let item = this.data[type][key];
      item.amount = amount;
      item.count = count;
      item.stamp = stamp;
    }
    const onError = (error) => {
      console.error(error.message);
    }

    // regular full sync
    let syncFullSnapshot = async () => {
      try{
        let rep = await crosFetch(snapshotUrl);
        let json = await rep.json();
        onSnapshot([channelId || 0, json]);
      }catch(error){
        console.error(error.message);
      }
    }
    let refresh = setInterval(syncFullSnapshot, SNAPSHOT_INTERVAL);
    this.refresh = refresh;
    syncFullSnapshot();

    // stream
    let socket = new WebSocket(url);

    socket.onmessage = (evt) => {
      try{

        let json = JSON.parse(evt.data);
  
        if('event' in json) return onResponse(json);
        
        if(isSnapshot(json)) return onSnapshot(json);
        
        if(isUpdate(json)) return onUpdate(json);

        console.log('unhandled: ',json);

      }catch(error){onError(error);}
    };

    socket.onopen = (evt) => {
      try{
        socket.send(JSON.stringify(cmd))
      } catch (error) {onError(error);}
    };

    socket.onclose = (evt) => {
      this.socket = null;
      this.data = null;
    };

    this.socket = socket;
    
  }
  disconnect(){
    this.socket && this.socket.close();
    this.refresh && clearInterval(this.refresh);
    this.socket = null;
    this.refresh = null;
  }
  snapshot(){
    return this.data ? {...this.data} : {};
  }
}