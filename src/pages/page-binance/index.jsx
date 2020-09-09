// deprecated
import React, { useRef, useEffect } from 'react';
import {BookView} from '../../components/book-view/1.0';
import {Symbols} from '../../core/books';
import {BinanceBook} from '../../core/books/binance';

export const PageBinance = () => {
  const source = useRef(new BinanceBook());
  useEffect(() => source.current.connect(Symbols.BTCUSDT), []);
  return (
    <div style={styles.container}>
      <BookView 
        bookSource={source.current}
        width={800} 
        height={800}
        />
    </div>
  );
}

const styles = {
  container: {
    flexDirection: 'row'
  }
};