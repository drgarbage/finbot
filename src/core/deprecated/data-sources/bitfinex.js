// deprecated

import ws from 'ws-wrapper';

// subscribe to channel
// receive the book snapshot and create your in-memory book structure
// when count > 0 then you have to add or update the price level
// 3.1 if amount > 0 then add/update bids
// 3.2 if amount < 0 then add/update asks
// when count = 0 then you have to delete the price level.
// 4.1 if amount = 1 then remove from bids
// 4.2 if amount = -1 then remove from asks

const parseSymbol = (symbol) => 
  `t${symbol.toUpperCase().replace(':','')}`

const bind = (url, command, {onResponse, onSnapshot, onUpdate, onError}) => {

  const w = new ws(new WebSocket(url));

  w.on('message', evt => {
    try{

      let data = evt.data;
      let obj = JSON.parse(data);

      if('event' in obj && onResponse){
        onResponse(obj);
        return;
      }

      if( Array.isArray(obj) && 
        Array.isArray(obj[1]) && 
        Array.isArray(obj[1][0]) &&
        onSnapshot){
        // [CHANNEL_ID, [ [PRICE, COUNT, AMOUNT], ... ]]
        let channel = obj[0];
        let value = obj[1];
        onSnapshot(channel, value);
        return;
      }

      if( Array.isArray(obj) && 
        Array.isArray(obj[1]) && 
        typeof obj[1][0] == 'number' &&
        onUpdate){
        // [CHANNEL_ID, [ PRICE, COUNT, AMOUNT ]]
        let channel = obj[0];
        let value = obj[1];
        onUpdate(channel, value);
        return;
      }

      console.log(evt.data);

    } catch (error) {

      if(onError)
        onError(error);

    }
  });

  w.on('open', () => {
    try{

      w.send(JSON.stringify(command))

    } catch (error) {

      if(onError)
        onError(error);

    }
  });
}

export const subscribe = ({symbol, channel = 'book'}, onUpdate) => {
  // symbol := crypto : currency
  
  let url = 'wss://api-pub.bitfinex.com/ws/2';
  let command = {
    event: "subscribe", 
    channel: channel, 
    symbol: parseSymbol(symbol),
    len: "100"
  };
  
  bind(url, command, {
    onResponse: (rsp) => { console.log('response:', JSON.stringify(rsp))},
    onSnapshot: (channel, snapshot) => {
      // snapshot: [ [price, count, amount] ]
      let output = {};
      let stamp = new Date().valueOf();
      snapshot.forEach(data => {
        output[data[0]] = { 
          type: parseFloat(data[2]) > 0 ? 'bid' : 'ask',
          price: parseFloat(data[0]), 
          count: parseInt(data[1]),
          amount: parseFloat(data[2]), 
          stamp 
        };
      });
      onUpdate(output);
    },
    onUpdate: (channel, data) => {
      // data: [price, count, amount]
      let output = {};
      output[data[0]] = { 
        type: parseFloat(data[2]) < 0 ? 'bid' : 'ask',
        price: parseFloat(data[0]), 
        count: parseInt(data[1]),
        amount: parseFloat(data[2]), 
        stamp: new Date().valueOf() 
      };
      onUpdate(output);
    }
  });
}