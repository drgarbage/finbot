// deprecated
import React, { useState } from 'react';
import {subscribe as subscribeBinance} from '../../core/data-sources/biance';
import {subscribe as subscribeBitfinex} from '../../core/data-sources/bitfinex';
import {BookPressureView} from '../../components/book-pressure-view';

export const PageBinance = (props) => {
  const [steps, setSteps] = useState(10);
  return (
    <div style={styles.container}>
      <BookPressureView 
        style={{background: 'black'}}
        symbol="BTC:USDT"
        channel="depth20@100ms"
        dataSource={{ subscribe: subscribeBinance }}
        priceSteps={steps}
        onPriceStepChanged={setSteps}
        priceOffset={1}
        width={300} 
        height={800} />
      <BookPressureView 
        style={{background: 'black'}}
        symbol="BTC:UST"
        dataSource={{ subscribe: subscribeBitfinex }}
        priceSteps={steps}
        onPriceStepChanged={setSteps}
        priceOffset={1}
        width={300} 
        height={800} />
    </div>
  );
}

const styles = {
  container: {
    flexDirection: 'row'
  }
};