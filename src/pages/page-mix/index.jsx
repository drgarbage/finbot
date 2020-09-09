import React, {useRef} from 'react';
import { 
  Symbols,
  BinanceBook,
  BitfinexBook,
  CoinbaseBook,
  Mixer
} from '../../core/books';
import { BookView } from '../../components/book-view';

export const PageMix = () => {
  const source = useRef(new Mixer([
    new BitfinexBook(), 
    new BinanceBook(), 
    new CoinbaseBook()
  ]));

  const connect = () => {
    console.info('connect');
    source.current.connect(Symbols.BTCUSD);
  }
  const disconnect = () => {
    console.info('disconnect');
    source.current.disconnect(Symbols.BTCUSD);
  }
  return (
    <div>
      <div>
        <button onClick={() => connect()}>CONNECT</button>
        <button onClick={() => disconnect()}>DISCONNECT</button>
      </div>
      <BookView
        width={window.innerWidth- 20}
        height={window.innerHeight - 100}
        bookSource={source.current}
        />
    </div>
  );
}