import React, { useRef, useEffect } from 'react';
import { Symbols, CoinbaseBook } from '../../core/books';
import { BookView } from '../../components/book-view/1.0';

export const PageCoinBase = (props) => {
  const source = useRef(new CoinbaseBook());
  useEffect(() => source.current.connect(Symbols.BTCUSD), []);
  return (
    <div>
      <BookView 
        width={800}
        height={800}
        bookSource={source.current}
        />
    </div>
  );
}