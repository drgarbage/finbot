import React, {useState, useEffect} from 'react';
import {PressureViewGrouped} from './pressure-view-grouped';

export const BookView = (props) => {
  const {
    width, height, bookSource
  } = props;

  // data
  // const [state, setState] = useState({book: {}, books: []});
  const [book, setBook] = useState({bids:{},asks:{}});

  useEffect(()=>{
    setInterval(()=>{
      setBook(bookSource.snapshot())
    }, 33);
  }, []);

  return (
    <PressureViewGrouped
      width={width}
      height={height}
      book={book}
      />
  );
}