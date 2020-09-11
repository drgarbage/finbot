import {Book} from '../';
import { crosFetch } from '../../utils';
import { 
  parseSymbol, 
  parseSnapshot,
} from './utils';

const SNAPSHOT_INTERVAL = 10000;
export class CoinbaseBook extends Book {
  constructor() {
    super();
    this.socket = null;
    this.data = null;
    this.refresh = null;
  }
  name(){return 'Coinbase';}
  connect(symbol) {
    if(this.socket) return;
    let url = 'wss://ws-feed.pro.coinbase.com';
    let snapshotUrl = `https://api.pro.coinbase.com/products/${parseSymbol(symbol)}/book?level=3`;
    let cmd = {
      type: "subscribe",
      product_ids: [ parseSymbol(symbol)],
      channels: ["level2"]
    }

    const onResponse = (obj) => {
      console.info('Coinbase connected: ', symbol);
    }
    const onSnapshot = (obj) => {
      this.data = parseSnapshot(obj);
    }
    const onUpdate = (obj) => {
      // let update = parseUpdate(obj);

      const smap = {"buy": "bids","sell": "asks"};
      const rmap = {"buy": 1,"sell": -1};

      obj.changes.forEach(change => {
        let [side, priceStr, amountStr] = change;
        let type = smap[side];
        let price = parseFloat(priceStr);
        let amount = parseFloat(amountStr);
        let stamp = new Date(obj.time).valueOf();

        if(amount === 0)
          return delete this.data[type][priceStr];
        
        if(!(priceStr in this.data[type]))
          return this.data[type][priceStr] = {
            type, price, amount, stamp
          };

        let item = this.data[type][priceStr];
        item.amount = amount * rmap[side];
        item.stamp = stamp;
      });
    }
    const onError = (error) => {
      console.error(error.message);
    }

    // regular full sync
    let syncFullSnapshot = async () => {
      try{
        let rep = await crosFetch(snapshotUrl);
        let json = await rep.json();
        onSnapshot(json);
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

        if(!json.type) return;

        if(json.type === 'snapshot')
          return onSnapshot(json);

        if(json.type === 'l2update')
          return onUpdate(json);
        
        return onResponse(json);
  
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