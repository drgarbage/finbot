import React, {useRef, useState, useEffect} from 'react';
import {decimalPlaces} from '../core/utils';
import _ from 'lodash';

const DELTA_MIN = 1;
const DELTA_MAX = 9999;
const GAPS = [0.001,0.01,0.1,1,5,10,50,100,500,1000];
const live = {cursor: {x: -1, y: -1}};

const findBestGap = (delta, height, textSize) => {
  // let rowHeight = height / (delta*2);
  // let jumpAmount = textSize / rowHeight;
  for(let g of GAPS)
    if(height / (delta * 2 * g) > textSize) 
      return g;
  return 1000;
}

const draw = (context, book) => {

  // value converters
  const v = (value) => _.round(value, decimalPlaces(context.price.gap) + 2);
  const av = (value) => Math.abs(v(value));
  const rangeInfo = (ary) => ary.length <= 0 ? '' : `${_.first(ary).price} - ${_.last(ary).price}`;
  const priceToScreenY = (value) => (value - context.price.origin) * context.scale.y;
  const screenYToPrice = (y) => (y / context.scale.y) + context.price.origin;
  const priceInRange = (price) => {
    if(price > context.price.max) return false;
    if(price < context.price.min) return false;
    return true;
  }
  
  // group functions
  const groupPrice = (value, gap) =>{
    if(!gap) gap = context.price.gap;
    let dplace = decimalPlaces(gap);
    let rs = gap * _.round(parseFloat(value) / gap, dplace);
    return rs;
  }
  const mountToGroup = (price, amount, stackedAmount) => {
    let {groups} = context;
    let priceAdj = groupPrice(price);
    let key = `${priceAdj}`;
    if(!(key in groups))
      return groups[key] = {price: priceAdj, amount, stackedAmount};
    groups[key].amount += amount;
    groups[key].stackedAmount += stackedAmount;
  }
  
  // render functions
  const renderPriceBar = (price, amount, sum, fillstyle) => {
    let {g, scale, price: {amountMax, sumMax}} = context;
    let {unit} = context.price;
    let amountWidth = av(amount / amountMax) * 100;
    let sumWidth = av(sum / sumMax) * 100;
    let barHeight = unit > 1 ? unit : 1;
    let posY = priceToScreenY(price) - (barHeight / 2);
    g.save();
    g.fillStyle = fillstyle;
    g.fillRect( 100, posY, amountWidth, barHeight);
    g.fillRect( 200, posY, sumWidth, barHeight);
    g.restore();
  }
  const renderPriceLabels = () => {
    let {g, price, groups} = context;
    g.save();
    g.fillStyle = 'silver';
    g.font = `${price.fontSize}px Arial`;
    g.textBaseline = 'middle';  

    for(let p in groups){
      let group = groups[p];
      let posY = priceToScreenY(group.price, context);
      g.fillText(p, 0, posY);
      g.fillText(av(group.amount, context), 110, posY);
      g.fillText(av(group.stackedAmount, context), 210, posY);
    }

    g.restore();
  }
  const renderGroupedBar = () => {
    let {groups} = context;
    for(let p in groups){
      let group = groups[p];
      renderPriceBar(
        group.price, 
        group.amount, 
        group.stackedAmount, 
        group.amount > 0 ? '#ff000033':'#00ff0033');
    }
  }
  const renderInfo = (lines, x, y, width) => {
    let { g } = context;
    g.save();
    g.fillStyle = '#00000088';
    g.fillRect(x, y, width, lines.length * 20 + 20);
    g.fillStyle = 'white';
    g.font = '12px Alial';
    lines.forEach((line,index) => g.fillText(
      line, x + 10, y + 20 + 20 * index
    ));
    g.restore();
  }
  const renderCursorInfo = () => {
    let {g, cursor, width, groups} = context;
    if(!cursor || cursor.x * cursor.y < 0) return;
  
    g.save();
    
    let cursorPrice = screenYToPrice(cursor.y - context.center.y, context);
    let nearGroupPrice = groupPrice(cursorPrice, context.price.gap).toString();
    let group = groups[nearGroupPrice] || {price:0,amount:0,stackedAmount:0};
    g.font = '20px Alial';
    g.fillStyle = '#ffffff33';
    g.fillRect(0, cursor.y, width, 1);
    g.fillStyle = 'white';
    g.textBaseline = 'middle';  
    g.fillText(
      `$${nearGroupPrice} : ${av(group.amount, context)} / ${av(group.stackedAmount, context)}`, 
      400, cursor.y);
  
    g.restore();
  
  }
  const renderChart = () => {
    let {g, center: {x, y}} = context;
    g.save();
    g.translate(x, y);
    renderGroupedBar();
    renderPriceLabels();
    g.restore();
  }
  const calculate = () => {
    let {sortedBids, sortedAsks} = context;
    let sumBids = 0;
    sortedBids.forEach(({price, amount}) => {
      if(!priceInRange(price)) return;
      sumBids+=amount;
      mountToGroup(price, amount, sumBids);
    });
    let sumAsks = 0;
    sortedAsks.reverse().forEach(({price, amount}) => {
      if(!priceInRange(price)) return;
      sumAsks+=amount;
      mountToGroup(price, amount, sumAsks);
    });
  }
  const renderOverlays = () => {
    let {
      width,
      sortedBids,
      sortedAsks,
      delta,
      price: {origin, gap, max, min, unit}, 
      scale: {x, y}} = context;
    let lines = [
      `SCALE: ( ${v(x)} , ${v(y)} ) `,
      `ORIGIN: ${origin} DELTA: ${delta}`,
      `GAP: ${gap} UNIT: ${unit}`,
      `PRICE MAX: ${max}`,
      `PRICE MIN: ${min}`,
      `ASKS: ${rangeInfo(sortedAsks)}`,
      `BIDS: ${rangeInfo(sortedBids)}`,
    ];
    renderInfo(lines, width - 220, 10, 200);
    renderCursorInfo();
  }
  const setup = (context, book) => {
    let {height, delta, zoom} = context;
    let sortedAsks = _(book.asks).sortBy('price').reverse().value();
    let sortedBids = _(book.bids).sortBy('price').reverse().value();


    let firstBid = sortedBids[0];
    let fontSize = 16;
    let gap = findBestGap(delta, height, fontSize);
  
    let priceOrigin = groupPrice(firstBid?.price || 0, gap);
    let priceMax = groupPrice(priceOrigin + delta * gap, gap);
    let priceMin = groupPrice(priceOrigin - delta * gap, gap);
    let priceToScreenUnit = height / (delta*gap*2);
  
    context.sortedAsks = sortedAsks;
    context.sortedBids = sortedBids;
    context.price = {
      origin: priceOrigin,
      max: priceMax,
      min: priceMin,
      unit: priceToScreenUnit,
      gap: gap,
      fontSize: fontSize,
    };
    context.scale = {
      x: zoom,
      y: priceToScreenUnit * -1
    };
    context.center = {x: 0, y: height * 0.5};
    context.groups = {};

  }

  // execute render
  setup(context, book);
  calculate();
  renderChart();
  renderOverlays();
};

export const PressureViewGrouped = (props) => {
  const { 
    width = 300, height = 300, book = {},
  } = props;

  const canvasRef = useRef(null);
  const [state, setState] = useState({
    delta: 10, zoom: 1, cursor: {x: -1, y: -1}, drag: null 
  });
  const { delta, zoom, cursor, drag } = state;

  useEffect(()=>{
    const canvasObj = canvasRef.current;
    const ctx = canvasObj.getContext('2d');
    ctx.clearRect(0,0,width,height);

    let context = {
      g: ctx,
      width, height, delta, zoom, cursor: live.cursor
    };
    draw(context, book);
  });

  return (
    <canvas
      style={{cursor: 'crosshair'}}
      ref={canvasRef}
      width={width}
      height={height}
      onPointerDownCapture={e => {
        let canvas = canvasRef.current;
        setState({...state, drag: {
          delta: delta, 
          x: e.clientX - canvas.offsetLeft, 
          y: e.clientY - canvas.offsetTop
        }});
        canvas.setPointerCapture(e.pointerId);
      }}
      onPointerMoveCapture={e => {
        let canvas = canvasRef.current;
        let nextCursor = {
          x: e.clientX - canvas.offsetLeft, 
          y: e.clientY - canvas.offsetTop
        };
        let nextDelta = delta;
        let nextZoom = zoom;

        if(drag) {
          let direction = (drag.y > height / 2) ? -1 : 1;
          let offsetY = nextCursor.y - drag.y;
          let offsetX = nextCursor.x - drag.x;

          nextDelta = drag.delta + offsetY * delta * 0.005 * direction;
          nextZoom = zoom + offsetX * 0.01;

          if(nextDelta < DELTA_MIN) nextDelta = DELTA_MIN;
          if(nextDelta > DELTA_MAX) nextDelta = DELTA_MAX;
          if(nextZoom < 1) nextZoom = 1;
          if(nextZoom > 99999) nextZoom = 99999;

          setState({
            ...state,
            ...({
              // cursor: nextCursor,
              delta: nextDelta,
              zoom: nextZoom
            })
          });
        }

        live.cursor = nextCursor;
      }}
      onPointerUpCapture={e => {
        if(!drag) return;
        setState({...state, drag: null});
        canvasRef.current.releasePointerCapture(e.pointerId);
      }}
    ></canvas>
  );
}
