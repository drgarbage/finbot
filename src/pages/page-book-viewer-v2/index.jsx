import React, {useRef} from 'react';
import { Symbols, Book } from '../../core/books';
import { BinanceBook } from '../../core/books/binance';
import { BitfinexBook } from '../../core/books/bitfinex';
import { CoinbaseBook } from '../../core/books/coinbase';
import { BookViewV2 as BookView } from '../../components/book-view-v2';

class JointBook extends Book {
  constructor(books = []){
    super();
    this.books = books;
  }
  connect(symbol){
    this.books.forEach(book => book.connect(symbol));
  }
  disconnect(){
    this.books.forEach(book => book.disconnect());
  }
  snapshot(){
    let output = {id:0, bids: {}, asks: {}};

    const add = (src, dest, key) => {
      if(!(key in dest))
        return dest[key] = src[key];

      dest[key].amount += src[key].amount;
      dest[key].stamp = src[key].stamp;
    }

    this.books.forEach(book => {
      let snap = book.snapshot();
      for(let key in snap.bids)
        add(snap.bids, output.bids, key);
      for(let key in snap.asks)
        add(snap.asks, output.asks, key);
    });

    return output;
  }
}

export const PageBookViewerV2 = (props) => {
  const bitfinex = useRef(new BitfinexBook());
  const binance = useRef(new BinanceBook());
  const coinbase = useRef(new CoinbaseBook());
  const joint = useRef(new JointBook([
    bitfinex.current, binance.current, coinbase.current
  ]));

  const connect = () => {
    console.info('connect');
    joint.current.connect(Symbols.BTCUSDT);
  }
  const disconnect = () => {
    console.info('disconnect');
    joint.current.disconnect();
  }
  return (
    <div>
      <div>
        <button onClick={() => connect()}>CONNECT</button>
        <button onClick={() => disconnect()}>DISCONNECT</button>
      </div>
      <BookView
        width={window.innerWidth- 100}
        height={window.innerHeight - 100}
        bookSource={joint.current}
        />
    </div>
  );
}