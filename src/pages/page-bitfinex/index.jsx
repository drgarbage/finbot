// deprecated
import React, { useRef, useEffect } from 'react';
import {BookView} from '../../components/book-view/1.0';
import {Symbols} from '../../core/books';
import {BitfinexBook} from '../../core/books/bitfinex';

export const PageBitfinex = () => {
  const source = useRef(new BitfinexBook());
  useEffect(() => source.current.connect(Symbols.BTCUSD), []);
  return (
    <div>
      <BookView 
        bookSource={source.current}
        width={800} 
        height={800} />
    </div>
  );
}