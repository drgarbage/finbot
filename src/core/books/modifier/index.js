import {Book} from '../';
import {decimalPlaces} from '../../utils';

const GAPS = [1000,500,100,50,10,5,1,0.5,0.05,0.005,0.0005,0.00005].reverse();

const groupPrice = (price, step) =>{
  let dplace = decimalPlaces(step);                   // 取分群單位的小數位數
  let scale = parseFloat(Math.pow(10, dplace));       // 計算縮放到整數位之縮放比例
  let priceScaled = price * scale;                    // 放大目標值
  let stepScaled = step * scale;                      // 放大分群單位到整數
  let stepCount = parseInt(priceScaled / stepScaled); // 計算出在第幾群
  let groupPriceScaled = Math.round(stepCount * stepScaled); // 計算該群價格
  let groupPrice = groupPriceScaled / scale;          // 縮小回原始位數
  return groupPrice;
}

export class Modifier extends Book {
  constructor(books = []) {
    this._books = books;
    this._delta = 999999;
    this._step = 1;
    this._center = null;
  }

  get books() {return this._books;}

  get center() {return this._center;}
  set center(value) {this.center = value;}

  get delta() {return this._delta;}
  set delta(value) {this._delta = value;}

  get step() {return this._step;}
  set step(value) {this._step = value;}

  autoStep(height, labelSize) {
    let rowHeight = height / (this.delta*2);
    if(rowHeight < labelSize){
      let jumpAmount = labelSize / rowHeight;
      for(let g of GAPS)
        if(g > jumpAmount) return g;
      return 1000;
    }
  
    return 1;
  }

  name(){return `${this.books.length} Books`;}
  connect(symbol){
    this._books.forEach(b => b.connect(symbol));
  }
  disconnect(){
    this._books.forEach(b => b.disconnect());
  }
  snapshot() {
    let output = {id: new Date().valueOf(), bids: {}, asks: {}};
    let range = {
      min: this.center !== null ? this.center - this.delta : Number.MIN_VALUE,
      max: this.center !== null ? this.center + this.delta : Number.MAX_VALUE
    }
    let stamp = new Date().valueOf();
    let maxBid = Number.MIN_VALUE;

    const isInRange = (price) => 
      price <= range.max && price >= range.min;
      
    const sumTo = (dst, {type, price, amount}) => {
      if(!isInRange(price)) return;
      let groupKey = groupPrice(price, this._step);
      if(!(groupKey in dst))
        dst[groupKey] = {type, price, amount, stamp};
      else
        dst[groupKey].amount += amount;
    }

    this._books.forEach(book => {
      for(let key in book.bids) {
        sumTo(output.bids, book.bids[key]);
        maxBid = Math.max(maxBid, book.bids[key].price);
      }
      for(let key in book.asks)
        sumTo(output.asks, book.asks[key]);
    });

    this._center = maxBid;

    return output;
  }
}