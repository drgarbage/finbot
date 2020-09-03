import React, {useState, useEffect} from 'react';
import {PressureViewPure} from './pressure-view-pure';

export const BookView = (props) => {
  const {
    width, height, bookSource
  } = props;

  // data
  // const [state, setState] = useState({book: {}, books: []});
  const [books, setBooks] = useState([]);

  useEffect(()=>{
    setInterval(()=>{
      let book = bookSource.snapshot();
      setBooks([book])
    }, 33);
  }, []);

  return (
    <PressureViewPure
      width={width}
      height={height}
      books={books}
      />
  );
}