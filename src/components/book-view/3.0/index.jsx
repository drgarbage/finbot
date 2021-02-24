import React, {useRef, useState, useEffect} from 'react';
import {decimalPlaces} from '../../../core/utils';
import _ from 'lodash';

const toGapped = (value, gap = 1.0) => {
  let dplace = decimalPlaces(gap);
  let scale = parseFloat(Math.pow(10, dplace));
  let valueScaled = value * scale;
  let gapScaled = gap * scale;
  let output = Math.floor(Math.floor(valueScaled / gapScaled) * gapScaled) / scale;
  return output;
}

const toGroup = (values, {gap, min, max}) => {
  return _(values)
    .filter(v => _.inRange(v.price, min, max))
    .groupBy(v => toGapped(v.price, gap))
    .map(v => ({
      price: toGapped(v[0].price, gap), 
      amount: _.sumBy(v, d => d.amount),
      stacked: 0
    }))
    .sortBy(['price']).reverse()
    .value();
}


class ChartCache {
  constructor(book, options) {
    let opt = {
      gap: 1,
      min: 0, 
      max: 9999,
      ...options
    };

    const v = value => _.round(value, decimalPlaces(this.options.gap) + 2);
    const av = value => Math.abs(v(value));
    const calculate = (values) => {
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

    this.options = opt;

    let sortedBids = toGroup(book.bids, opt);
    let sortedAsks = toGroup(book.asks, opt);
    let summaryBids = calculate(sortedBids);
    let summaryAsks = calculate(sortedAsks.reverse());
    
    let mergeMap = {};
    mergeIn(sortedBids, mergeMap);
    mergeIn(sortedAsks, mergeMap);

    this.cache = {
      sortedBids,
      sortedAsks,
      summaryBids,
      summaryAsks,
      mergeMap,
      merge: _.toArray(mergeMap),
      maxAmount: Math.max(
        av(summaryBids.maxAmount),
        av(summaryAsks.maxAmount)
      ),
      maxSum: Math.max(
        av(summaryBids.maxSum),
        av(summaryAsks.maxSum)
      )
    }
  }
  get sortedBids(){return this.cache.sortedBids;}
  get sortedAsks(){return this.cache.sortedAsks;}
  get summaryBids(){return this.cache.summaryBids;}
  get summaryAsks(){return this.cache.summaryAsks;}
  get mergeMap(){return this.cache.mergeMap;}
  get merge(){return this.cache.merge;}
  get gap(){return this.options.gap;}
  get range(){return this.options;}
  get maxAmount(){return this.cache.maxAmount;}
  get maxSum(){return this.cache.maxSum;}
}

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
    for(let p = toGapped(pr.min, labelGap); p <= toGapped(pr.max, labelGap); p+=labelGap/2){
      g.fillStyle = p % labelGap == 0 ? 'rgba(65,90,101,0)' : 'rgba(65,90,101,1)';
      g.fillRect(0, p2ui(p), physical.w, 1);
    }
    g.restore();
  }
  const renderBar = (context, value, {gap, maxAmount, maxSum, fill}) => {
    let { g, columns } = context;
    let x = 0, y = p2ui(value.price), h = p2ui(gap);
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
    let { g, cursor, physical, priceOrigin, barGap } = context;

    if(!cursor) return;

    let pos = {x: 0, y: cursor.y - (physical.h / 2) - -p2ui(priceOrigin)};
    let price = av(ui2p(pos.y));
    let groupPrice = toGapped(price, barGap);
    let groupAmount = (groupPrice in cache.mergeMap) ?
      av(cache.mergeMap[groupPrice].amount) : 'N/A';

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
    let { g, physical: { w, h }, labelGap } = context;
    let { sortedBids, sortedAsks, maxAmount, maxSum } = cache;
    let range = priceRange(context);
    let lines = [
      `MAX AMT: ${v(maxAmount)}`,
      `MAX SUM: ${v(maxSum)}`,
      `BIDS: ${rangev(sortedBids)}`,
      `ASKS: ${rangev(sortedAsks)}`,
      `VIEW: ${v(range.min)} - ${v(range.max)}`,
      `GVIEW: ${v(toGapped(range.min, labelGap))} - ${v(toGapped(range.max, labelGap))}`,
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
  const renderHistory = (context, history) => {
    let {g, historyWidth} = context;
    // console.log(history);
    // history.reverse();
    console.log(history);
    history.forEach((book, index) => {
      book.merge.forEach(value => {
        let x = historyWidth - index, y = p2ui(value.price), h = p2ui(book.gap);
        // let a = av(value.amount) / book.maxAmount;
        console.log(value);
        g.save();
        g.fillStyle = 'yellow';
        g.fillRect(x, y, 2, h);
        g.restore();
      })
    });
  }
  const render = (context, cache) => {
    let { g, priceOrigin, physical } = context;
    let { label, bar, history } = cache;

    g.clearRect(0, 0, physical.w, physical.h);
    g.save();
    g.translate(0, physical.h/2);

    renderHistory(context, history);

    renderCaption(context);

    g.translate(0, -p2ui(priceOrigin));
    
    renderGrid(context);

    bar.merge.forEach(v => 
        renderBar(context, v, {
          gap: bar.gap,
          maxAmount: bar.maxAmount, 
          maxSum: bar.maxSum, 
          fill: v.amount > 0 ? 
            'rgb(46,204,113,.7)' : 
            'rgb(231,76,20,.7)'}));
  
    label.merge.forEach(v =>
      renderLabel(context, v, {fill: 'white', font: '14px Helvetica'}));
    
    renderCursor(context, bar);

    g.restore();
    
    if(context.overlay)
      renderOverlay(context, bar);
  }
  const init = (context) => {
    const { books } = context;
    const book = _.last(books);
    let range = priceRange(context);
    context.labelGap = range.bestLabelGap;
    context.barGap = range.bestBarGap;
    let labelCache = new ChartCache(book, {
      gap: range.bestLabelGap,
      min: range.min,
      max: range.max
    });
    let barCache = new ChartCache(book, {
      gap: range.bestBarGap,
      min: range.min,
      max: range.max
    });
    let history = _(books)
      .takeRight(400)
      .map(b => new ChartCache(b,{
        gap: range.bestBarGap,
        min: range.min,
        max: range.max
      }))
      .value();
    return {
      label: labelCache,
      bar: barCache,
      history
    }
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
  const historyWidth = width - 400;
  const canvasRef = useRef(null);
  const dragStart = useRef(null);
  const cursor = useRef(null);
  const origin = useRef(0);
  const firstOrigin = useRef(-1);
  const loop = useRef(null);
  const [config, setConfig] = useState({
    historyWidth,
    priceOrigin: 0,
    priceScale: zoom,
    overlay: false,
    columns: [
      {cx: historyWidth +   0, cy: 0, w: 100, h: 20},
      {cx: historyWidth + 100, cy: 0, w: 100, h: 20},
      {cx: historyWidth + 200, cy: 0, w: 100, h: 20},
    ],
    physical: {w: width, h: height},
  });
  const [books, setBooks] = useState([]);

  useEffect(()=>{
    if(books.length == 0) return;
    const canvasObj = canvasRef.current;
    const g = canvasObj.getContext('2d');
    draw({g, ...config, 
      caption: bookSource.name(),
      priceOrigin: origin.current, 
      priceScale: zoom,
      cursor: cursor.current,
      books: books});
  });

  useEffect(()=>{
    loop.current = setInterval(() => {
        let snap = bookSource.snapshot();
        if(firstOrigin.current == -1) {
          let first = _(snap.bids).sortBy(['price']).last();
          firstOrigin.current = !first ? -1 : first.price;
          origin.current = firstOrigin.current;
        } 
        setBooks(books => [...books, snap]);
      }, 1000);
    
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