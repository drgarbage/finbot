import React, {useRef} from 'react';
import { BinanceBook } from '../../core/books/binance';
import { BitfinexBook } from '../../core/books/bitfinex';
import { BookView } from '../../components/book-view';

export const PageBookViewer = (props) => {
  const bitfinex = useRef(new BitfinexBook());
  const binance = useRef(new BinanceBook());

  const connect = () => {
    console.info('connect');
    bitfinex.current.connect('BTC:UST');
    binance.current.connect('BTC:USDT');
  }
  const disconnect = () => {
    console.info('disconnect');
    bitfinex.current.disconnect();
    binance.current.disconnect();
  }
  return (
    <div>
      <div>
        <button onClick={() => connect()}>CONNECT</button>
        <button onClick={() => disconnect()}>DISCONNECT</button>
      </div>
      <BookView 
        width={400}
        height={400}
        bookSource={bitfinex.current}
        />
      <BookView
        width={400}
        height={400}
        bookSource={bitfinex.current}
        />
    </div>
  );
}