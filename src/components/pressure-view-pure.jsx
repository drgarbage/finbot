import React, {useRef, useState, useEffect} from 'react';
import _ from 'lodash';

const DELTA_MIN = 10;
const DELTA_MAX = 9999;
const GAPS = [1000,500,100,50,10,5,1,0.5,0.05,0.005,0.0005,0.00005].reverse();

const findBestGap = (delta, height, textSize) => {
  let rowHeight = height / (delta*2);
  if(rowHeight < textSize){
    let jumpAmount = textSize / rowHeight;
    for(let g of GAPS)
      if(g > jumpAmount) return g;
    return 1000;
  }

  return 1;
}

const priceInRange = (price, context) => {
  if(price > context.price.max) return false;
  if(price < context.price.min) return false;
  return true;
}

const drawGrid = (ctx) => {

  ctx.save();

  for(let y = -999; y < 999 ; y += 50) {
    ctx.fillStyle = 'silver';
    ctx.fillRect(-999, y, 2000, 0.5);
  }

  for(let x = -999; x < 999; x += 50) {
    ctx.fillStyle = 'silver';
    ctx.fillRect(x, -999, 0.5, 2000);
  }

  ctx.restore();

}

const drawBar = (ctx, value, sumValue, {price, scale}) => {
  let posY = (value.price - price.origin) * scale.y;
  let amountWidth = Math.abs(value.amount) * scale.x;
  ctx.fillRect( 100, posY, amountWidth, price.unit);
  ctx.fillRect( 200, posY, sumValue, price.unit);
}

const drawPriceLabel = (ctx, {price, scale}) => {
  for(let p = _.round(price.min); p < price.max ; p += 1) {
    if(p % price.gap !== 0) continue;
    ctx.fillStyle = 'silver';
    ctx.font = `${price.fontSize}px Arial`;
    ctx.textBaseline = 'middle';  
    ctx.fillText(p, 0, (p - price.origin) * scale.y);
  }
}

const drawBook = (ctx, {delta, width, height}, book) => {
  let sortedAsks = _(book.asks).sortBy('price').reverse().value();
  let sortedBids = _(book.bids).sortBy('price').reverse().value();
  let firstBid = sortedBids[0];

  let priceOrigin = firstBid?.price || 0;
  let priceMax = priceOrigin + delta;
  let priceMin = priceOrigin - delta;
  let priceToScreenUnit = height / (delta*2);

  let context = {
    g: ctx,
    delta: delta,
    price: {
      origin: priceOrigin,
      max: priceMax,
      min: priceMin,
      unit: priceToScreenUnit,
      gap: findBestGap(delta, height, 16),
      fontSize: 16,
    },
    scale: {
      x: 10,
      y: priceToScreenUnit * -1
    }
  }
  let center = {x: 0, y: height * 0.5};

  ctx.save();
  ctx.translate(center.x, center.y);

  // drawGrid(ctx);

  let sumBids = 0;
  ctx.fillStyle = 'green';
  sortedBids.forEach(value => {
    if(!priceInRange(value.price, context)) return;
    sumBids+=Math.abs(value.amount);
    drawBar(ctx, value, sumBids, context);
  });
      
  let sumAsks = 0;
  ctx.fillStyle = 'red';
  sortedAsks.reverse().forEach(value => {
    if(!priceInRange(value.price, context)) return;
    sumAsks+=Math.abs(value.amount);
    drawBar(ctx, value, sumAsks, context);
  });

  drawPriceLabel(ctx, context);
      
  ctx.restore();
  
  ctx.fillStyle = 'white';
  ctx.fillText(`SCALE: ( ${context.scale.x} , ${context.scale.y} )`, width - 100, 40);
  ctx.fillText(`ORIGIN: ${priceOrigin}`, width - 100, 60);
  ctx.fillText(`PRICE MAX: ${priceMax}`, width - 100, 80);
  ctx.fillText(`PRICE MIN: ${priceMin}`, width - 100, 100);

};

const draw = (ctx, {delta, width, height}, books) => {
  if(books.length > 0)
    drawBook(ctx, {delta, width, height}, books[0]);
};

export const PressureViewPure = (props) => {
  const { 
    width = 300, height = 300, books = [],
  } = props;

  const canvasRef = useRef(null);
  const [delta, setDelta] = useState(10);
  const [dragStart, setDragStart] = useState(null);

  useEffect(()=>{
    const canvasObj = canvasRef.current;
    const ctx = canvasObj.getContext('2d');
    ctx.clearRect(0,0,width,height);

    draw(ctx, {delta,width,height}, books);
  });  

  return (
    <canvas
      style={props.style}
      ref={canvasRef}
      width={width}
      height={height}
      onPointerDownCapture={e => {
        setDragStart({delta, x: e.clientX, y: e.clientY});
        canvasRef.current.setPointerCapture(e.pointerId);
      }}
      onPointerMoveCapture={e => {
        if(!dragStart) return;
        let cur = {x: e.clientX, y:e.clientY};

        let direction = (dragStart.y > height / 2) ? -1 : 1;
        let offset = (cur.y - dragStart.y) * 0.5 * 0.5;
        let nextDelta = dragStart.delta + offset * direction;

        if(nextDelta < DELTA_MIN) nextDelta = DELTA_MIN;
        if(nextDelta > DELTA_MAX) nextDelta = DELTA_MAX;

        setDelta(nextDelta);
      }}
      onPointerUpCapture={e => {
        if(!dragStart) return;
        setDragStart(null);
        canvasRef.current.releasePointerCapture(e.pointerId);
      }}
    ></canvas>
  );
}