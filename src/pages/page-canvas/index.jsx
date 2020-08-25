import React from 'react';
import {BookTable} from './booktable';

export const PageCanvas = (props) => {
  return (
    <div>
      <BookTable 
        style={{background: 'black'}}
        width={800} 
        height={800} />
    </div>
  );
}