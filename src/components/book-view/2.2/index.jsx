import React, {useRef, useState, useEffect} from 'react';
import {decimalPlaces} from '../../../core/utils';
import _ from 'lodash';

const draw = (context) => {
  const v = value => _.round(value, decimalPlaces(context.labelGap) + 2);
  const av = value => Math.abs(v(value));
  const p2ui = price => price * context.priceScale * -1;
  const ui2p = value => value / context.priceScale;
  const priceRange = (context) => {
    let { physical, priceOrigin } = context;
    let verticalHalfPriceRange = ui2p(physical.h / 2);
    let visualMinPrice = priceOrigin - verticalHalfPriceRange;
    let visualMaxPrice = priceOrigin + verticalHalfPriceRange;

    let rowHeightPrice = ui2p(20);
    let bestLabelGap = 1;
    let bestBarGap = 1;
    let labelGaps = [0.01,0.05,0.1,0.5,1,2,2.5,5,10,20,50,100,150,200,250,500,1000,2000,2500,5000];
    for(let i = 0; i < labelGaps.length; i++){
      let gap = labelGaps[i];
      if(gap > rowHeightPrice){
        bestLabelGap = gap; 
        bestBarGap = gap > 5 ? 5 : gap; 
        break;
      }
    }

    return {
      min: visualMinPrice,
      max: visualMaxPrice,
      bestLabelGap: bestLabelGap,
      bestBarGap: bestBarGap,
    }
  }

  // displaying
  const rangev = values => {
    return values.length > 0 ? 
      `${v(values[0].price)} - ${v(_.last(values).price)}` : 'N/A';
  }

  // labelGap related
  const gv = (price) => { // label grouped price value
    let { labelGap } = context;
    let dplace = decimalPlaces(labelGap);
    let scale = parseFloat(Math.pow(10, dplace));
    let valueScaled = price * scale;
    let gapScaled = labelGap * scale;
    let output = Math.floor(Math.floor(valueScaled / gapScaled) * gapScaled) / scale;
    return output;
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

  // barGap related
  const bv = (price) => { // bar grouped price value
    let { barGap } = context;
    let dplace = decimalPlaces(barGap);
    let scale = parseFloat(Math.pow(10, dplace));
    let valueScaled = price * scale;
    let gapScaled = barGap * scale;
    let output = Math.floor(Math.floor(valueScaled / gapScaled) * gapScaled) / scale;
    return output;
  }
  const baring = (context, values, range) => {
    return _(values)
      .filter(v => _.inRange(v.price, range.min, range.max))
      .groupBy(v => bv(v.price))
      .map(v => ({
        price: bv(v[0].price), 
        amount: _.sumBy(v, d => d.amount),
        stacked: 0
      }))
      .sortBy(['price']).reverse()
      .value();
  }

  // processing
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

  // drawing
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
  const renderGrid = (context) => {
    let { g, physical, labelGap, priceScale } = context;
    if(labelGap * priceScale < 10) return;

    let pr = priceRange(context);
    g.save();
    for(let p = gv(pr.min); p <= gv(pr.max); p+=labelGap/2){
      g.fillStyle = p % labelGap == 0 ? 'rgba(65,90,101,0)' : 'rgba(65,90,101,1)';
      g.fillRect(0, p2ui(p), physical.w, 1);
    }
    g.restore();
  }
  const renderLabelBar = (context, value, {maxAmount, maxSum, fill}) => {
    let { g, columns, labelGap } = context;
    let x = 0, y = p2ui(value.price), h = p2ui(labelGap);
    let a = av(value.amount) / maxAmount;
    let s = av(value.stacked) / maxSum;
    g.save();
    g.translate(x,y);
    bar(context, {...columns[1], w: columns[1].w * a, h, fill});
    bar(context, {...columns[2], w: columns[2].w * s, h, fill});
    g.restore();
  }
  const renderBar = (context, value, {maxAmount, maxSum, fill}) => {
    let { g, columns, barGap } = context;
    let x = 0, y = p2ui(value.price), h = p2ui(barGap);
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
  const renderCursor = (context, cache) => {
    let { g, cursor, physical, priceOrigin } = context;

    if(!cursor) return;

    let pos = {x: 0, y: cursor.y - (physical.h / 2) - -p2ui(priceOrigin)};
    let price = av(ui2p(pos.y));
    // let groupPrice = gv(price);
    // let groupAmount = (groupPrice in cache.mergeMap) ?
    //   av(cache.mergeMap[groupPrice].amount) : 'N/A';
    let groupPrice = bv(price);
    let groupAmount = (groupPrice in cache.barMergeMap) ?
      av(cache.barMergeMap[groupPrice].amount) : 'N/A';

    g.save();
    g.fillStyle = '#ffffff55';
    g.fillRect(pos.x, pos.y, physical.w, 1);
    
    g.font = '18px Helvetica';
    g.textBaseline = 'middle';
    let text = `${price} - ${groupAmount}`;
    let textSize = g.measureText(text);

    g.strokeStyle = '#ffffff55';
    g.clearRect(pos.x + 5, pos.y - 15, textSize.width + 10, 30);
    g.strokeRect(pos.x + 5, pos.y - 15, textSize.width + 10, 30);

    g.fillStyle = '#ffffff';
    g.fillText(text, pos.x + 10, pos.y );
    
    g.restore();
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
      `GVIEW: ${v(gv(range.min))} - ${v(gv(range.max))}`,
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
  const renderCaption = (context) => {
    let {g, caption, physical} = context;
    g.save();
    g.translate(physical.w - 200, physical.h/2 - 40)
    g.fillStyle = '#00000055';
    g.font = `30px Arial Black`;
    g.textBaseline = 'middle';
    g.fillText(caption.toUpperCase(), 0, 0);
    g.restore();
  }
  const render = (context, cache) => {
    let { g, priceOrigin, physical } = context;
    let { merge, maxAmount, maxSum, barMerge, maxBarAmount, maxBarSum } = cache;

    g.clearRect(0, 0, physical.w, physical.h);
    g.save();
    g.translate(0, physical.h/2);

    renderCaption(context);

    g.translate(0, -p2ui(priceOrigin));
    
    renderGrid(context);

    // merge.forEach(v => 
    //   renderLabelBar(context, v, {maxAmount, maxSum, fill: v.amount > 0 ? 'rgb(46,204,113,.7)' : 'rgb(231,76,20,.7)'}));

    barMerge.forEach(v => 
        renderBar(context, v, {maxAmount: maxBarAmount, maxSum: maxBarSum, fill: v.amount > 0 ? 'rgb(46,204,113,.7)' : 'rgb(231,76,20,.7)'}));
  
    merge.forEach(v =>
      renderLabel(context, v, {fill: 'white', font: '14px Helvetica'}));
    
    renderCursor(context, cache);

    g.restore();
    
    if(context.overlay)
      renderOverlay(context, cache);
  }
  const init = (context) => {
    const { book } = context;
    let cache = {};
    let range = priceRange(context);
    // context.priceGap = range.bestLabelGap; // deprecated
    context.labelGap = range.bestLabelGap;
    context.barGap = range.bestBarGap;
    
    // for label
    cache.sortedBids = grouping(context, book.bids, range);
    cache.summaryBids = calculate(context, cache.sortedBids);
    cache.sortedAsks = grouping(context, book.asks, range);
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

    cache.mergeMap = merge;
    cache.merge = _.toArray(merge);

    // for bar
    cache.sortedBarBids = baring(context, book.bids, range);
    cache.summaryBarBids = calculate(context, cache.sortedBarBids);
    cache.sortedBarAsks = baring(context, book.asks, range);
    cache.summaryBarAsks = calculate(context, cache.sortedBarAsks.reverse());

    cache.maxBarAmount = Math.max(
      av(cache.summaryBarBids.maxAmount),
      av(cache.summaryBarAsks.maxAmount)
    );
    cache.maxBarSum = Math.max(
      av(cache.summaryBarBids.maxSum),
      av(cache.summaryBarAsks.maxSum)
    );

    let barMerge = {};
    mergeIn(cache.sortedBarBids, barMerge);
    mergeIn(cache.sortedBarAsks, barMerge);

    cache.barMergeMap = barMerge;
    cache.barMerge = _.toArray(barMerge);

    return cache;
  }

  let cache = init(context);
  render(context, cache);
};

// var dragStart = null;
// var cursor = null;
// var origin = 0, firstOrigin = -1;

export const BookView = (props) => {
  const {
    width = 300, height = 300, bookSource, zoom = 1,
  } = props;
  const columnStartX = 0;
  const canvasRef = useRef(null);
  const dragStart = useRef(null);
  const cursor = useRef(null);
  const origin = useRef(0);
  const firstOrigin = useRef(-1);
  const loop = useRef(null);
  const [config, setConfig] = useState({
    priceOrigin: 0,
    priceScale: zoom,
    overlay: false,
    columns: [
      {cx: columnStartX +   0, cy: 0, w: 100, h: 20},
      {cx: columnStartX + 100, cy: 0, w: 100, h: 20},
      {cx: columnStartX + 200, cy: 0, w: 100, h: 20},
      {cx: columnStartX + 300, cy: 0, w: 100, h: 20},
    ],
    physical: {w: width, h: height},
  })
  const [book, setBook] = useState({bids:{},asks:{}});

  useEffect(()=>{
    const canvasObj = canvasRef.current;
    const g = canvasObj.getContext('2d');
    draw({g, ...config, 
      caption: bookSource.name(),
      priceOrigin: origin.current, 
      priceScale: zoom,
      cursor: cursor.current,
      book});
  });

  useEffect(()=>{
    loop.current = setInterval(() => {
        let snap = bookSource.snapshot();
        if(firstOrigin.current == -1) {
          let first = _(snap.bids).sortBy(['price']).last();
          firstOrigin.current = !first ? -1 : first.price;
          origin.current = firstOrigin.current;
        } 
        setBook(() => (snap));
      }, 33);
    
    bookSource.connect('BTC:USDT');

    return () => clearInterval(loop.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={config.physical.w}
      height={config.physical.h}

      onDoubleClick={event=>{
        setConfig(config => ({...config, overlay: !config.overlay}));
      }}

      onPointerDown={event=>{
        cursor.current = {
          x: event.clientX - event.target.offsetLeft, 
          y: event.clientY - event.target.offsetTop
        };
        dragStart.current = {
          x: event.clientX, 
          y: event.clientY,
          oy: origin.current,
        };
      }}

      onPointerMove={event=>{
        cursor.current = {
          x: event.clientX - event.target.offsetLeft, 
          y: event.clientY - event.target.offsetTop
        };
        if(!dragStart.current) return;
        let offset = {
          x: event.clientX - dragStart.current.x,
          y: event.clientY - dragStart.current.y
        };
        origin.current = dragStart.current.oy + (offset.y / zoom);
      }}

      onPointerUp={event=>{
        cursor.current = null;
        dragStart.current = null;
      }}

      onPointerOut={event=>{
        cursor.current = null;
        dragStart.current = null;
      }}
    ></canvas>
  );
}