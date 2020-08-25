import React, { useEffect } from 'react';
import Binance from 'binance-api-node';

const connect = () => {
  // const client = Binance();
  // client.ws.trades(['BTCUSDT'], trade => {
  //   console.log(trade)
  // });
}

export const PageBinance = (props) => {

  useEffect(()=>{
    connect();
  }, []);

  return (
    <div>CONNECTING</div>
  );
}