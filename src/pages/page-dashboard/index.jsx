import React, {useRef, useState} from 'react';
import { 
  Symbols,
  BinanceBook,
  BitfinexBook,
  CoinbaseBook,
  Mixer
} from '../../core/books';
import { BookView } from '../../components/book-view';

const size = {
  w: window.innerWidth - 40,
  h: window.innerHeight - 150
}

export const PageDashboard = () => {
  const bitfinex = useRef(new BitfinexBook());
  const binance = useRef(new BinanceBook());
  const coinbase = useRef(new CoinbaseBook());
  const source = useRef(new Mixer([
    bitfinex.current, binance.current, coinbase.current
  ]));
  const [zoom, setZoom] = useState(1.0);

  return (
    <div>
      <input 
        type="range" 
        width="500px"
        min={1} 
        max={2500}
        value={zoom*1000}
        onChange={e => setZoom(e.target.value*0.001)}
        />
      <BookView
        width={size.w / 2}
        height={size.h / 2}
        bookSource={bitfinex.current}
        zoom={zoom}
        />
      <BookView
        width={size.w / 2}
        height={size.h / 2}
        bookSource={binance.current}
        zoom={zoom}
        />
      <BookView
        width={size.w / 2}
        height={size.h / 2}
        bookSource={coinbase.current}
        zoom={zoom}
        />
        <BookView
          width={size.w / 2}
          height={size.h / 2}
          bookSource={source.current}
          zoom={zoom}
          />
    </div>
  );
}