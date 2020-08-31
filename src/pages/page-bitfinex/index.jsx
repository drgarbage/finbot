import React from 'react';
import {BookPressureView} from '../../components/book-pressure-view';
import {subscribe} from '../../core/data-sources/bitfinex'

export const PageBitfinex = (props) => {
  return (
    <div>
      <BookPressureView 
        style={{background: 'black'}}
        symbol="BTC:USD"
        dataSource={{ subscribe }}
        width={800} 
        height={800} />
    </div>
  );
}