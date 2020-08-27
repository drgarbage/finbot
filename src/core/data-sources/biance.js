import ws from 'ws-wrapper';

const logger = {
  info: console.log,
  warn: console.log
}

class SocketClient {
  constructor(path, baseUrl) {
    this.baseUrl = baseUrl || 'wss://stream.binance.com:9443/';
    this._path = path;
    this._createSocket();
    this._handlers = new Map();
  }

  _createSocket() {
    console.log(`PATH - ${this.baseUrl}${this._path}`);
    this._ws = new ws(new WebSocket(`${this.baseUrl}${this._path}`));

    // this._ws.onopen = () => {
    //   logger.info('ws connected');
    // };
    this._ws.on('open', ()=>console.log('ws connected'));

    this._ws.on('pong', () => {
      logger.info('receieved pong from server');
    });
    this._ws.on('ping', () => {
      logger.info('==========receieved ping from server');
      this._ws.pong();
    });

    this._ws.onclose = () => {
      logger.warn('ws closed');
    };

    this._ws.onerror = (err) => {
      logger.warn('ws error', err);
    };

    // this._ws.onmessage = (msg) => {
    //   try {
    //     const message = JSON.parse(msg.data);
    //     if (message.e) {
    //       if (this._handlers.has(message.e)) {
    //         this._handlers.get(message.e).forEach((cb) => {
    //           cb(message);
    //         });
    //       } else {
    //         logger.warn('Unprocessed method', message);
    //       }
    //     } else {
    //       logger.warn('Unprocessed method', message);
    //     }
    //   } catch (e) {
    //     logger.warn('Parse message failed', e);
    //   }
    // };
    this._ws.on('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if(!message.e)
          throw new Error(`ERROR:${JSON.stringify(message)}`);

        if(!this._handlers.has(message.e))
          throw new Error(`ERROR:${JSON.stringify(message)}`);

        this._handlers.get(message.e).forEach(cb => {
          cb(message);
        });

      } catch (error) {
        console.log(error);
      }
    });

    this.heartBeat();
  }

  heartBeat() {
    setInterval(() => {
      if (this._ws.readyState === WebSocket.OPEN) {
        this._ws.ping();
        logger.info("ping server");
      }
    }, 5000);
  }

  setHandler(method, callback) {
    if (!this._handlers.has(method)) {
      this._handlers.set(method, []);
    }
    this._handlers.get(method).push(callback);
  }
}

export const subscribe = ({symbol} , onUpdate) => {
  const socket = new SocketClient('ws/btcusdt@trade');
  socket.setHandler('trade', (params) => console.log(params));
  // let url = "wss://stream.binance.com:9443/ws";
  // let subscribeId = new Date().valueOf();
  // let command = {
  //   method: "SUBSCRIBE",
  //   params: [
  //     "btcusd@trade"
  //   ],
  //   id: subscribeId
  // }

  // bind(url, command, {
  //   onResponse: (data) => console.log('onResponse', data),
  //   onSnapshot: (data) => console.log('onSnapshot', data),
  //   onUpdate: (data) => {
  //     console.log('onUpdate', data)
  //     onUpdate(data);
  //   },
  //   onError: (error) => console.error(error),
  // });

}