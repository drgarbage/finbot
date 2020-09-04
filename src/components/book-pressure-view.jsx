// deprecated
import React, {useState, useEffect} from 'react';
import {PressureView} from './pressure-view';
import _ from 'lodash';

const BUFFER_SIZE = 400;

export const BookPressureView = (props) => {
  const {
    width, height, 
    symbol, dataSource, 
    priceSteps, priceOffset, 
    onPriceStepChanged, 
    showHistory 
  } = props;

  // data
  const [state, setState] = useState({book: {}, books: []});
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

    setInterval(()=>{
      onBookUpdate(latestBook);
    }, 66);
  }, []);

  return (
    <PressureView
      width={width}
      height={height}
      delta={priceSteps}
      deltaOffset={deltaOffset}
      book={state.book}
      books={state.books}
      showHistory={showHistory}
      onDeltaChanged={onPriceStepChanged}
      />
  );
}