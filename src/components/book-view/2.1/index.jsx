import React, {useRef, useState, useEffect} from 'react';
import {decimalPlaces} from '../../../core/utils';
import _ from 'lodash';

const draw = (context) => {
  const v = value => _.round(value, decimalPlaces(context.priceGap) + 2);
  const av = value => Math.abs(v(value));
  const p2ui = price => price * context.priceScale * -1;
  const ui2p = value => value / context.priceScale;
  const priceRange = (context) => {
    let { physical, priceOrigin } = context;
    let verticalHalfPriceRange = ui2p(physical.h / 2);
    let visualMinPrice = priceOrigin - verticalHalfPriceRange;
    let visualMaxPrice = priceOrigin + verticalHalfPriceRange;
    let visualMinPriceGroup = gv(visualMinPrice);
    let visualMaxPriceGroup = gv(visualMaxPrice);

    let rowHeightPrice = ui2p(20);
    let bestGap = 1;
    let labelGaps = [0.01,0.05,0.1,0.5,1,2,2.5,5,10,20,50,100,150,200,250,500,1000,2000,2500,5000];
    for(let i = 0; i < labelGaps.length; i++){
      if(labelGaps[i] > rowHeightPrice){
        bestGap = labelGaps[i]; 
        break;
      }
    }

    return {
      min: visualMinPrice,
      max: visualMaxPrice,
      gmin: visualMinPriceGroup,
      gmax: visualMaxPriceGroup,
      bestGap: bestGap,
    }
  }
  const gv = (price) => {
    let { priceGap } = context;
    let dplace = decimalPlaces(priceGap);
    let scale = parseFloat(Math.pow(10, dplace));
    let valueScaled = price * scale;
    let gapScaled = priceGap * scale;
    let output = Math.floor(Math.floor(valueScaled / gapScaled) * gapScaled) / scale;
    return output;
  }
  const rangev = values => {
    return values.length > 0 ? 
      `${v(values[0].price)} - ${v(_.last(values).price)}` : 'N/A';
  }
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
  const grouping = (context, values, range) => {
    return _(values)
      .filter(v => _.inRange(v.price, range.min, range.max))
      .groupBy(v => gv(v.price))
      .map(v => ({
        price: gv(v[0].price), 
        amount: _.sumBy(v, d => d.amount),
        stacked: 0
      }))
      .sortBy(['price']).reverse()
      .value();
  }
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
  const mergeIn = (values, merged) => {
    values.forEach(v => {
      let key = v.price;
      if(!(key in merged))
        return merged[key] = {price: v.price, amount: v.amount, stacked: v.stacked};
      merged[key].amount += v.amount;
      merged[key].stacked += v.stacked;
    });
  }
  const renderGrid = (context) => {
    let { g, physical, priceGap, priceScale } = context;
    if(priceGap * priceScale < 10) return;

    let pr = priceRange(context);
    g.save();
    for(let p = pr.gmin; p <= pr.gmax; p+=priceGap/2){
      g.fillStyle = p % priceGap == 0 ? 'rgba(65,90,101,0)' : 'rgba(65,90,101,1)';
      g.fillRect(0, p2ui(p), physical.w, 1);
    }
    g.restore();
  }
  const renderBar = (context, value, {maxAmount, maxSum, fill}) => {
    let { g, columns, priceGap } = context;
    let x = 0, y = p2ui(value.price), h = p2ui(priceGap);
    let a = av(value.amount) / maxAmount;
    let s = av(value.stacked) / maxSum;
    g.save();
    g.translate(x,y);
    bar(context, {...columns[1], w: columns[1].w * a, h, fill});
    bar(context, {...columns[2], w: columns[2].w * s, h, fill});
    g.restore();
  }
  const renderLabel = (context, value, {fill, font}) => {
    let { g, columns } = context;
    let x = 0, y = p2ui(value.price);
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
    let range = priceRange(context);
    let lines = [
      `MAX AMT: ${v(maxAmount)}`,
      `MAX SUM: ${v(maxSum)}`,
      `BIDS: ${rangev(sortedBids)}`,
      `ASKS: ${rangev(sortedAsks)}`,
      `VIEW: ${v(range.min)} - ${v(range.max)}`,
      `GVIEW: ${v(range.gmin)} - ${v(range.gmax)}`,
    ];

    g.save();
    g.translate(w-160, h-(lines.length * 20));
    g.fillStyle = '#00000055';
    g.fillRect(-10, -20, 180, lines.length * 20 + 15);
    g.fillStyle = 'white';
    g.font = '12px Arial';
    lines.forEach((line, index) => g.fillText(line, 0, index * 20));
    g.restore();
  }
  const render = (context, cache) => {
    let { g, viewport, priceOrigin, physical } = context;
    let { sortedBids, sortedAsks, merge, maxAmount, maxSum } = cache;

    g.clearRect(0, 0, physical.w, physical.h);
    g.save();
    g.translate(0, physical.h/2);
    g.translate(0, -p2ui(priceOrigin));
    g.scale(viewport.w, viewport.h);
    
    renderGrid(context);

    merge.forEach(v => 
      renderBar(context, v, {maxAmount, maxSum, fill: v.amount > 0 ? 'rgb(46,204,113)' : 'rgb(231,76,20)'}));

    merge.forEach(v =>
      renderLabel(context, v, {fill: 'white', font: '14px Helvetica'}));

    // sortedBids.forEach(v => 
    //   renderBar(context, v, {maxAmount, maxSum, fill: 'rgb(46,204,113)'}));
    
    // sortedAsks.forEach(v =>
    //   renderBar(context, v, {maxAmount, maxSum, fill: 'rgb(231,76,20)'}));
    
    // sortedBids.forEach(v =>
    //   renderLabel(context, v, {fill: 'white', font: '14px Helvetica'}));
    
    // sortedAsks.forEach(v =>
    //   renderLabel(context, v, {fill: 'white', font: '14px Helvetica'}));
    
    renderCursor(context);

    g.restore();
    
    renderOverlay(context, cache);
  }
  const init = (context) => {
    const { book } = context;
    let cache = {};
    let range = priceRange(context);
    context.priceGap = range.bestGap;
    cache.sortedBids = grouping(context, book.bids, range);
    cache.sortedAsks = grouping(context, book.asks, range);
    cache.summaryBids = calculate(context, cache.sortedBids);
    cache.summaryAsks = calculate(context, cache.sortedAsks.reverse());
    cache.maxAmount = Math.max(
      av(cache.summaryBids.maxAmount),
      av(cache.summaryAsks.maxAmount));
    cache.maxSum = Math.max(
      av(cache.summaryBids.maxSum),
      av(cache.summaryAsks.maxSum));
      
    let merge = {};
    
    mergeIn(cache.sortedBids, merge);
    mergeIn(cache.sortedAsks, merge);

    cache.merge = _.toArray(merge);

    return cache;
  }

  let cache = init(context);
  render(context, cache);
};

var dragStart = null;
var origin = 0, firstOrigin = -1;

export const BookView = (props) => {
  const {
    width = 300, height = 300, bookSource,
    pricePin = 0, zoom = 1, 
  } = props;
  const canvasRef = useRef(null);
  const [config, setConfig] = useState({
    priceOrigin: pricePin,
    priceScale: zoom,
    columns: [
      {cx:   0, cy: 0, w: 100, h: 20},
      {cx: 100, cy: 0, w: 100, h: 20},
      {cx: 200, cy: 0, w: 100, h: 20},
      {cx: 300, cy: 0, w: 100, h: 20},
    ],
    viewport: {ox: 0, oy: 0, w: 1, h: 1},
    physical: {w: width, h: height},
  })
  const [book, setBook] = useState({bids:{},asks:{}});

  useEffect(()=>{
    const canvasObj = canvasRef.current;
    const g = canvasObj.getContext('2d');
    draw({g, ...config, 
      priceOrigin: origin, 
      priceScale: zoom,
      book});
  });

  useEffect(()=>{
    var loop = setInterval(() => {
        let snap = bookSource.snapshot();
        if(firstOrigin == -1) {
          let first = _(snap.bids).sortBy(['price']).last();
          firstOrigin = !first ? -1 : first.price;
          origin = firstOrigin;
        } 
        setBook(() => snap);
      }, 33);
    
    bookSource.connect('BTC:USDT');
    origin = pricePin;

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
        origin = dragStart.oy + (offset.y / zoom);
      }}
      onPointerUp={event=>{
        dragStart = null;
      }}
    ></canvas>
  );
}