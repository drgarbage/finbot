import ws from 'ws-wrapper';

export const subscribe = (url, command, {onResponse, onSnapshot, onUpdate, onError}) => {

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

export const subscribeTicker = (callback) => {

  let url = 'wss://api-pub.bitfinex.com/ws/2';
  let command = {
    event: 'subscribe',
    channel: 'tickeer',
    symbol: 'tBTCUSD'
  };

  subscribe(url, command, {
    onResponse: (rsp) => { console.log('response:', JSON.stringify(rsp))},
    onSnapshot: (channel, snapshot) => {console.log('snapshot:', JSON.stringify(snapshot)); callback(snapshot);},
    onUpdate: (channel, data) => {console.log('update', JSON.stringify(data)); callback(data);}
  });

}

export const subscribeBook = (callback) => {
  // response price: { count, amount }

  let url = 'wss://api-pub.bitfinex.com/ws/2';
  let command = {
    event: 'subscribe', 
    channel: 'book', 
    symbol: 'tBTCUSD',
    percision: 'P4',
    length: "1000", 
  };
  
  subscribe(url, command, {
    onResponse: (rsp) => { console.log('response:', JSON.stringify(rsp))},
    onSnapshot: (channel, snapshot) => {
      // snapshot: [ [price, count, amount] ]
      let output = {};
      let stamp = new Date();
      snapshot.forEach(data => {
        output[data[0]] = { price: parseFloat(data[0]), count: parseInt(data[1]), amount: parseFloat(data[2]), stamp };
      });
      callback(output);
    },
    onUpdate: (channel, data) => {
      // data: [price, count, amount]
      let output = {};
      output[data[0]] = { price: parseFloat(data[0]), count: parseInt(data[1]), amount: parseFloat(data[2]), stamp: new Date() };
      callback(output);
    }
  });

}

export const subscribeRawBook = (callback) => {
  // response price: { count, amount }

  let url = 'wss://api-pub.bitfinex.com/ws/2';
  let command = {
    event: 'subscribe', 
    channel: 'book', 
    symbol: 'tBTCUSD',
    prec: 'R0',
  };
  
  subscribe(url, command, {
    onResponse: (rsp) => { console.log('response:', JSON.stringify(rsp))},
    onSnapshot: (channel, snapshot) => {
      // snapshot: [ [price, count, amount] ]
      let output = {};
      let stamp = new Date();
      snapshot.forEach(data => {
        output[data[1]] = { orderId: data[0], price: parseFloat(data[1]), amount: parseFloat(data[2]), stamp };
      });
      callback(output);
    },
    onUpdate: (channel, data) => {
      // data: [price, count, amount]
      let output = {};
      output[data[1]] = { orderId: data[0], price: parseFloat(data[1]), amount: parseFloat(data[2]), stamp: new Date() };
      callback(output);
    }
  });

}