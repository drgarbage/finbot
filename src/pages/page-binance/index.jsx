import React, { useEffect } from 'react';
import { subscribe } from '../../core/data-sources/biance';
import { useState } from 'react';

export const PageBinance = (props) => {
  const [data, setData] = useState({});

  useEffect(()=>{
    subscribe({symbol:'BTCUSD'}, setData);
  }, []);

  return (
    <div>{JSON.stringify(data)}</div>
  );
}