import React, {useRef} from 'react';
import { CoinbaseBook } from '../../core/books/coinbase';
import { BookView } from '../../components/book-view';

export const PageCoinBase = (props) => {
  const coinbase = useRef(new CoinbaseBook());

  const connect = () => {
    console.info('connect');
    coinbase.current.connect('BTC:USD');
  }
  const disconnect = () => {
    console.info('disconnect');
    coinbase.current.disconnect();
  }
  return (
    <div>
      <div>
        <button onClick={() => connect()}>CONNECT</button>
        <button onClick={() => disconnect()}>DISCONNECT</button>
      </div>
      <BookView 
        width={800}
        height={800}
        bookSource={coinbase.current}
        />
    </div>
  );
}