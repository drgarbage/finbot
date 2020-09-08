import React, {useRef, useState, useEffect} from 'react';
import {decimalPlaces} from '../core/utils';
import _ from 'lodash';

const draw = (context) => {
  const v = value => _.round(value, decimalPlaces(context.priceGap));
  const av = value => Math.abs(v(value));
  const gv = (price, gap) => {
    let dplace = decimalPlaces(gap);
    let scale = parseFloat(Math.pow(10, dplace));
    let valueScaled = price * scale;
    let gapScaled = gap * scale;
    return Math.round(parseInt(valueScaled / gapScaled) * gapScaled) / scale;
  }
  const rangev = values => values.length > 0 ? 
    `${v(values[0].price)} - ${v(_.last(values).price)}` : 'N/A';
  const bar = (context, {cx, cy, w, h, fill}) => {
    let { g } = context;
    g.save();
    g.fillStyle = fill;
    g.fillRect(cx, cy - h/2, w, h);
    g.restore();
  }
  const label = (context, text, {cx, cy, w, fill, font}) => {
    let { g } = context;
    g.save();
    g.fillStyle = fill;
    g.font = font;
    g.textBaseline = 'middle';  
    g.fillText(text, cx, cy, w);
    g.restore();
  }
  const grouping = (context, values) =>
    _(values)
    .groupBy(v => gv(v.price, context.priceGap))
    .map(v => ({
      price: v[0].price, 
      amount: _.sumBy(v, d => d.amount),
      stacked: 0
    }))
    .sortBy(['price']).reverse()
    .value();
  const calculate = (context, values) => {
    var sum = 0, maxAmount = 0, maxSum = 0;
    values.forEach(v => {
      sum += v.amount;
      maxAmount = av(v.amount) > av(maxAmount) ? 
        v.amount : maxAmount;
      maxSum = sum;
      v.stacked = sum;
    });
    return { maxAmount, maxSum };
  }
  const renderGrid = (context) => {
    let { g } = context;
    g.save();
    g.fillStyle = '#ffffff11';
    for(let x = -10000; x < 10000; x += 100)
      for(let y = -10000; y < 10000; y += 100){
        g.fillRect(-10000, y, 20000, 1);
        g.fillRect(x, -10000, 1, 20000);
      }
    g.restore();
  }
  const renderBar = (context, value, {maxAmount, maxSum, fill}) => {
    let { g, columns, priceGap } = context;
    let x = 0, y = value.price;
    let a = av(value.amount) / maxAmount;
    let s = av(value.stacked) / maxSum;
    g.save();
    g.translate(x,y);
    bar(context, {...columns[1], w: columns[1].w * a, h: priceGap, fill});
    bar(context, {...columns[2], w: columns[2].w * s, h: priceGap, fill});
    g.restore();
  }
  const renderLabel = (context, value, {fill, font}) => {
    let { g, columns } = context;
    let x = 0, y = value.price;
    g.save();
    g.translate(x,y);
    label(context, v(value.price), {...columns[0], cx: columns[0].cx + 10, fill, font});
    label(context, av(value.amount), {...columns[1], cx: columns[1].cx + 10, fill, font});
    label(context, av(value.stacked), {...columns[2], cx: columns[2].cx + 10, fill, font});
    g.restore();
  }
  const renderCursor = (context) => {
    let { g } = context;
  }
  const renderOverlay = (context, cache) => {
    let { g, physical: { w, h } } = context;
    let { sortedBids, sortedAsks, maxAmount, maxSum } = cache;
    let lines = [
      `MAX AMT: ${v(maxAmount)}`,
      `MAX SUM: ${v(maxSum)}`,
      `BIDS: ${rangev(sortedBids)}`,
      `ASKS: ${rangev(sortedAsks)}`,
    ];

    g.save();
    g.translate(w-150, 40);
    g.fillStyle = 'white';
    g.font = '12px Arial';
    lines.forEach((line, index) => g.fillText(line, 0, index * 20));
    g.restore();
  }
  const render = (context, cache) => {
    let { g, priceOrigin, physical } = context;
    let { sortedBids, sortedAsks, maxAmount, maxSum } = cache;

    g.clearRect(0, 0, physical.w, physical.h);
    g.save();
    g.translate(0, physical.h/2);
    g.translate(0, -priceOrigin);
    
    renderGrid(context);

    sortedBids.forEach(v => 
      renderBar(context, v, {maxAmount, maxSum, fill: 'green'}));
    
    sortedAsks.forEach(v =>
      renderBar(context, v, {maxAmount, maxSum, fill: 'red'}));
    
    sortedBids.forEach(v =>
      renderLabel(context, v, {fill: 'white', font: '16px Arial'}));
    
    sortedAsks.forEach(v =>
      renderLabel(context, v, {fill: 'white', font: '16px Arial'}));
    
    renderCursor(context);

    g.restore();
    
    renderOverlay(context, cache);
  }
  const init = (context) => {
    const { book } = context;
    let cache = {};
    cache.sortedBids = grouping(context, book.bids);
    cache.sortedAsks = grouping(context, book.asks);
    cache.summaryBids = calculate(context, cache.sortedBids);
    cache.summaryAsks = calculate(context, cache.sortedAsks.reverse());
    cache.maxAmount = Math.max(
      av(cache.summaryBids.maxAmount),
      av(cache.summaryAsks.maxAmount));
    cache.maxSum = Math.max(
      av(cache.summaryBids.maxSum),
      av(cache.summaryAsks.maxSum));
    return cache;
  }

  let cache = init(context);
  render(context, cache);
};

var dragStart = null;
var origin = 11500;

export const BookViewV2 = (props) => {
  const {
    width = 300, height = 300, bookSource
  } = props;

  const canvasRef = useRef(null);
  const [config, setConfig] = useState({
    priceOrigin: 0,
    priceScale: 1,
    priceGap: 100,
    columns: [
      {cx:   0, cy: 0, w: 100, h: 20},
      {cx: 100, cy: 0, w: 100, h: 20},
      {cx: 200, cy: 0, w: 100, h: 20},
      {cx: 300, cy: 0, w: 100, h: 20},
    ],
    viewport: {ox: 0, oy: 0, w: 1, h: 1},
    physical: {w: width, h: height},
  })
  const [book, setBook] = useState({bids:{},asks:{}})

  useEffect(()=>{
    const canvasObj = canvasRef.current;
    const g = canvasObj.getContext('2d');
    draw({g, ...config, priceOrigin: origin, book});
  });

  useEffect(()=>{
    var loop = setInterval(() => {
      var b = {bids:{},asks:{}};
      for(let p = -200; p < 15000; p++) {
        let type = p > 11500 ? 'asks' : 'bids';
        b[type][p] = {
          price: p,
          amount: Math.random() * 10 + Math.random()
        }
      }
      setBook(b);
    }, 33);
    // var loop = setInterval(
    //   () => setBook(bookSource.snapshot()), 33);
    return () => clearInterval(loop);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={config.physical.w}
      height={config.physical.h}
      onPointerDown={event=>{
        dragStart = {
          x: event.clientX, 
          y: event.clientY,
          oy: origin,
        };
      }}
      onPointerMove={event=>{
        if(!dragStart) return;
        let offset = {
          x: event.clientX - dragStart.x,
          y: event.clientY - dragStart.y
        };
        origin = dragStart.oy - offset.y;
      }}
      onPointerUp={event=>{
        dragStart = null;
      }}
    ></canvas>
  );
}