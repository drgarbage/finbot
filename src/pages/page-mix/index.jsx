import React, {useRef, useState} from 'react';
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
  const [zoom, setZoom] = useState(1.0);

  return (
    <div>
      <input 
        type="range"
        min={1} 
        max={22000}
        value={zoom*1000}
        onChange={e => setZoom(e.target.value*0.001)}
        />
      <BookView
        width={window.innerWidth- 40}
        height={window.innerHeight - 140}
        bookSource={source.current}
        zoom={zoom}
        />
    </div>
  );
}