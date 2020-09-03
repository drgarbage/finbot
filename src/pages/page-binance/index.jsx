import React, { useState } from 'react';
import {subscribe} from '../../core/data-sources/biance';
import {BookPressureView} from '../../components/book-pressure-view';

export const PageBinance = () => {
  const [steps, setSteps] = useState(10);
  return (
    <div style={styles.container}>
      <BookPressureView 
        style={{background: 'black'}}
        symbol="BTC:USDT"
        channel="depth20@100ms"
        dataSource={{ subscribe }}
        priceSteps={steps}
        onPriceStepChanged={setSteps}
        priceOffset={1}
        showHistory
        width={800} 
        height={800} />
    </div>
  );
}

const styles = {
  container: {
    flexDirection: 'row'
  }
};