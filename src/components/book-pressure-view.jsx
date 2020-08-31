import React, {useState, useEffect} from 'react';
import {subscribe} from '../core/data-sources/bitfinex';
import {PressureView} from './pressure-view';
import _ from 'lodash';

const BUFFER_SIZE = 400;

export const BookPressureView = (props) => {
  const {width, height, symbol, dataSource, priceOffset } = props;

  // data
  const [state, setState] = useState({book: {}, books: []});
  const [delta, setDelta] = useState(20);
  const [deltaOffset] = useState(priceOffset || 1);

  const onBookUpdate = data => {
    setState(state => {
      let updatedBook = {...state.book, ...data};
      let updatedBooks = [...state.books, updatedBook];
      if(updatedBooks.length > BUFFER_SIZE)
        updatedBooks = _.slice(updatedBooks, updatedBooks.length - BUFFER_SIZE, updatedBooks.length);
      return ({
        book: updatedBook,
        books: updatedBooks,
      })
    });
  };

  useEffect(()=>{
    let latestBook = {};

    dataSource.subscribe({symbol}, data => {
      latestBook = {...latestBook, ...data};
    });
    // subscribe({symbol:'BTC:USD'}, data => {
    //   latestBook = {...latestBook, ...data};
    // });

    setInterval(()=>{
      onBookUpdate(latestBook);
    }, 66);
  }, []);

  return (
    <PressureView
      width={width}
      height={height}
      delta={delta}
      deltaOffset={deltaOffset}
      book={state.book}
      books={state.books}
      onDeltaChanged={setDelta}
      />
  );
}