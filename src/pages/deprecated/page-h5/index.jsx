// deprecated
import React, {useEffect, useState} from 'react';
import {subscribeBook, subscribeRawBook} from '../../../core/deprecated/applications';
import _ from 'lodash';
import './index.css';

const EXPIRED = 10 * 1000;

const sum = (list, index, middle) => {
  return index <= middle ?
    _.sum(_(list)
      .slice(index, middle)
      .map('amount')
      .value()) :
    _.sum(_(list)
      .slice(middle, index)
      .map('amount')
      .value());
}

export const PageH5 = (props) => {
  const [book, setBook] = useState({});
  const [rawBook, setRawBook] = useState({});
  const now = new Date();

  useEffect(()=>{
    subscribeBook(data => setBook(book => ({...book, ...data})));
    subscribeRawBook(data => setRawBook(rawBook => ({...rawBook, ...data})));
  }, []);

  let bookList = _(book)
    .toArray()
    .sort((a,b) => a.price < b.price)
    .filter(n => (now - n.stamp) <= EXPIRED)
    .reverse()
    .value();

  let bookMiddleIndex = _.findIndex(bookList, v => v.amount >= 0);

  let rawBookList = _(rawBook)
    .toArray()
    .sort((a,b) => a.price < b.price)
    .filter(n => (now - n.stamp) <= EXPIRED)
    .reverse()
    .value();

  return (
    <div className="App">
        
      <div className="panel">
        <ul>
          {
            bookList.map((value, index) => {
              let s = sum(bookList, index, bookMiddleIndex);
              return (
                  <li className="card" key={value.price}>
                    <div className="price">{value.price}</div>
                    <div className="amountBG" style={{width:Math.abs(value.amount) * 10, background: value.amount > 0 ? 'green' : 'red'}}></div>
                    <div className="amount">{Math.abs(value.amount)}</div>
                    <div className="sumBG" style={{width:Math.abs(s), background: s > 0 ? 'green' : 'red'}}></div>
                    <div className="sum">{Math.abs(s)}</div>
                  </li>
                );
              }
            )
          }
        </ul>
      </div>

      <div className="panel">
        <ul>
          {
            rawBookList.map((value) => {
              return (
                  <li className="card" key={value.price}>
                    <div className="price">{value.price}</div>
                    <div className="amountBG" style={{width:Math.abs(value.amount) * 10, background: value.amount > 0 ? 'green' : 'red'}}></div>
                    <div className="amount">{Math.abs(value.amount)}</div>
                  </li>
                );
              }
            )
          }  
        </ul>
      </div>
      
    </div>
  );
}