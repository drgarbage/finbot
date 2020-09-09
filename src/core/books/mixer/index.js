import {Book} from '../';

export class Mixer extends Book {
  constructor(books = []){
    super();
    this.books = books;
  }
  connect(symbol){
    this.books.forEach(book => book.connect(symbol));
  }
  disconnect(){
    this.books.forEach(book => book.disconnect());
  }
  snapshot(){
    let output = {id:0, bids: {}, asks: {}};

    const add = (src, dest, key) => {
      if(!(key in dest))
        return dest[key] = src[key];

      dest[key].amount += src[key].amount;
      dest[key].stamp = src[key].stamp;
    }

    this.books.forEach(book => {
      let snap = book.snapshot();
      for(let key in snap.bids)
        add(snap.bids, output.bids, key);
      for(let key in snap.asks)
        add(snap.asks, output.asks, key);
    });

    return output;
  }
}