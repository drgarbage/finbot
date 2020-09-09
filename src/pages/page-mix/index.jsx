import React, {useRef} from 'react';
import { 
  Symbols,
  BinanceBook,
  BitfinexBook,
  CoinbaseBook,
  Mixer
} from '../../core/books';
import { BookView } from '../../components/book-view';
import { useState } from 'react';

const level = [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 150, 200, 250, 500];

export const PageMix = () => {
  const source = useRef(new Mixer([
    new BitfinexBook(), 
    new BinanceBook(), 
    new CoinbaseBook()
  ]));
  const [config, setConfig] = useState({zoom: 8, gap: 1});

  const onConfigChanged = (changes) => {
    console.log('changes', changes);
    setConfig(config => ({...config, ...changes}));
  }

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
      <div style={{backgroundColor: 'gray', padding: 10, marginBottom: 10, color: 'white'}}>
        <button onClick={() => connect()}>CONNECT</button>
        <button onClick={() => disconnect()}>DISCONNECT</button>

        <label style={{padding: 10}}>Gap</label>
        <select value={config.gap}
          onChange={e => onConfigChanged({gap: parseFloat(e.target.value)})}
          >
          <option>0.01</option>
          <option>0.1</option>
          <option>1</option>
          <option>5</option>
          <option>10</option>
          <option>20</option>
          <option>25</option>
          <option>50</option>
          <option>100</option>
          <option>150</option>
          <option>200</option>
          <option>250</option>
          <option>500</option>
          <option>1000</option>
        </select>

        <label style={{padding: 10}}>Zoom</label>
        <input 
          type="range" 
          min={0} 
          max={level.length-1}
          value={config.zoom}
          onChange={e => onConfigChanged({zoom: parseFloat(e.target.value)})}
          />
      </div>
      <BookView
        width={window.innerWidth- 40}
        height={window.innerHeight - 200}
        bookSource={source.current}
        zoom={level[config.zoom]}
        gap={config.gap}
        pricePin={10195}
        />
    </div>
  );
}