import React, {useState, useEffect} from 'react';
import {PressureView} from './pressure-view';
import { update } from 'lodash';

export const BookView = (props) => {
  const {
    width, height, bookSource,
    priceSteps = 10, priceOffset = 1, 
    onPriceStepChanged = () => {}, 
    showHistory = false
  } = props;

  // data
  const [state, setState] = useState({book: {}, books: []});

  useEffect(()=>{
    var loop = setInterval(()=>{
      setState(state => {
        let snap = bookSource.snapshot();
        let updatedBook = {...snap.bids, ...snap.asks};
        let updatedBooks = [...state.books, updatedBook];
        return {
          book: updatedBook,
          books: updatedBooks
        }
      });
    }, 33);
    return () => clearInterval(loop);
  }, []);

  return (
    <PressureView
      width={width}
      height={height}
      book={state.book}
      books={state.books}
      delta={priceSteps}
      deltaOffset={priceOffset}
      showHistory={showHistory}
      onDeltaChanged={onPriceStepChanged}
      />
  );
}