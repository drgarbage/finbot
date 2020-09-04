import React, {useRef, useState, useEffect} from 'react';
import {decimalPlaces} from '../core/utils';
import _ from 'lodash';

const DELTA_MIN = 10;
const DELTA_MAX = 9999;
const GAPS = [1000,500,100,50,10,5,1,0.5,0.05,0.005,0.0005,0.00005].reverse();

const groupPrice = (price, gap) =>{
  let dplace = decimalPlaces(gap);
  let scale = parseFloat(Math.pow(10, dplace));
  let valueScaled = price * scale;
  let doScaled = gap * scale;
  return Math.round(parseInt(valueScaled / doScaled) * doScaled) / scale;
}

const mountToGroup = (price, amount, stackedAmount, groups, context) => {
  let priceAdj = groupPrice(price, context.price.gap);
  let key = `${priceAdj}`;
  
  if(!(key in groups))
    return groups[key] = {amount, stackedAmount};
  
  groups[key].amount += amount;
  groups[key].stackedAmount += stackedAmount;
}

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
  ctx.fillRect( 200, posY, sumValue * scale.x * 0.01, price.unit);
}

const drawPriceLabel = (ctx, {price, scale}, groups) => {
  for(let p = _.round(price.min); p < price.max ; p += 1) {
    if(p % price.gap !== 0) continue;
    let posY = (p - price.origin) * scale.y;
    ctx.fillStyle = 'silver';
    ctx.font = `${price.fontSize}px Arial`;
    ctx.textBaseline = 'middle';  
    ctx.fillText(p, 0, posY);

    let priceKey = `${p}`;
    if(priceKey in groups){
      let group = groups[priceKey];
      ctx.fillText(Math.abs(_.round(group.amount, decimalPlaces(price.gap) + 2)), 110, posY);
      ctx.fillText(_.round(group.stackedAmount, decimalPlaces(price.gap) + 2), 210, posY);
    }
  }
}

const drawBook = (ctx, {delta, width, height, zoom}, book) => {
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
      x: zoom,
      y: priceToScreenUnit * -1
    }
  }
  let center = {x: 0, y: height * 0.5};
  let groups = {};

  ctx.save();
  ctx.translate(center.x, center.y);

  // drawGrid(ctx);

  let sumBids = 0;
  ctx.fillStyle = '#00ff0033';
  sortedBids.forEach(value => {
    if(!priceInRange(value.price, context)) return;
    sumBids+=Math.abs(value.amount);
    drawBar(ctx, value, sumBids, context);
    mountToGroup(value.price, value.amount, sumBids, groups, context);
  });
      
  let sumAsks = 0;
  ctx.fillStyle = '#ff000033';
  sortedAsks.reverse().forEach(value => {
    if(!priceInRange(value.price, context)) return;
    sumAsks+=Math.abs(value.amount);
    drawBar(ctx, value, sumAsks, context);
    mountToGroup(value.price, value.amount, sumAsks, groups, context);
  });

  drawPriceLabel(ctx, context, groups);
      
  ctx.restore();

  console.log(width);
  
  let posX = width - 150;
  let posY = 40;
  ctx.fillStyle = '#00000088';
  ctx.fillRect(posX - 10, posY - 20, 150, 130);
  ctx.fillStyle = 'white';
  ctx.fillText(`SCALE: ( ${context.scale.x} , ${context.scale.y} )`, posX, posY);
  ctx.fillText(`ORIGIN: ${priceOrigin}`, posX, posY+=20);
  ctx.fillText(`PRICE MAX: ${priceMax}`, posX, posY+=20);
  ctx.fillText(`PRICE MIN: ${priceMin}`, posX, posY+=20);
  
  if(sortedAsks.length > 0)
    ctx.fillText(
      `ASKS: ${_.first(sortedAsks).price} - ${_.last(sortedAsks).price}`, 
      posX, posY+=20 );

  if(sortedBids.length > 0)
    ctx.fillText(
      `BIDS: ${_.first(sortedBids).price} - ${_.last(sortedBids).price}`, 
      posX, posY+=20 );

};

const draw = (ctx, {delta, width, height, zoom}, books) => {
  if(books.length > 0)
    drawBook(ctx, {delta, width, height, zoom}, books[0]);
};

export const PressureViewPure = (props) => {
  const { 
    width = 300, height = 300, books = [],
  } = props;

  const canvasRef = useRef(null);
  const [delta, setDelta] = useState(10);
  const [zoom, setZoom] = useState(10);
  const [dragStart, setDragStart] = useState(null);

  useEffect(()=>{
    const canvasObj = canvasRef.current;
    const ctx = canvasObj.getContext('2d');
    ctx.clearRect(0,0,width,height);

    draw(ctx, {delta,width,height,zoom}, books);
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
        let offsetY = cur.y - dragStart.y;
        let offsetX = cur.x - dragStart.x;
        let nextDelta = dragStart.delta + offsetY * delta * 0.005 * direction;
        let nextZoom = zoom + offsetX * 0.01;

        if(nextDelta < DELTA_MIN) nextDelta = DELTA_MIN;
        if(nextDelta > DELTA_MAX) nextDelta = DELTA_MAX;
        if(nextZoom < 0.0001) nextZoom = 0.0001;
        if(nextZoom > 99999) nextZoom = 99999;

        setDelta(nextDelta);
        setZoom(nextZoom);
      }}
      onPointerUpCapture={e => {
        if(!dragStart) return;
        setDragStart(null);
        canvasRef.current.releasePointerCapture(e.pointerId);
      }}
    ></canvas>
  );
}