import React from 'react';
import {subscribe} from '../../core/data-sources/biance';
import {BookPressureView} from '../../components/book-pressure-view';

export const PageBinance = (props) => {
  return (
    <div>
      <BookPressureView 
        style={{background: 'black'}}
        symbol="BTC:USDT"
        dataSource={{ subscribe }}
        width={800} 
        height={800} />
    </div>
  );
}