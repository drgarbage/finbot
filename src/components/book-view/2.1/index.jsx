import React, {useRef, useState, useEffect} from 'react';
import {decimalPlaces} from '../../../core/utils';
import _ from 'lodash';

const draw = (context) => {
  // let {g, config, book} = context;

  let columns = [
    {cx: 0, cy: 0, w: 100, h: 20},    // label
    {cx: 100, cy: 0, w: 100, h: 20},  // amount
    {cx: 200, cy: 0, w: 100, h: 20},  // stacked amount
    {cx: 300, cy: 0, w: 100, h: 20},  // info
  ];

  const v = (value) => _.round(v, 2);
  const av = (value) => Math.abs(v(value));
  const g = (value, gap) => {
    let dplace = decimalPlaces(gap);
    let scale = Math.pow(10, dplace);
    let valueScaled = value * scale;
    let gapScaled = gap * scale;

    return Math.round(parseInt(valueScaled / gapScaled) * gapScaled) / scale;
  };
  const p2c = (price) => price * context.viewport.h; // 價格到邏輯點
  // const c2p = (logicY) => logicY * (1.0 / context.viewport.h); // 邏輯點到價格
  // const s2c = (screenY) => screenY - offsetY; // 滑鼠點到邏輯點
  // const c2s = (logicY) => logicY - (-offsetY);// 邏輯點到滑鼠點
  // const s2p = (screenY) => c2p(s2c(screenY)); // 滑鼠點到價格
  // const p2s = (price) => c2s(p2c(price));     // 價格到滑鼠點
  const bar = (context, {cx, cy, w, h, fill}) => {
    let { g } = context;
    g.save();
    g.translate(-cx, -cy);
    g.fillStyle = fill;
    g.fillRect(0, -h/2, w, h);
    g.restore();
  }
  const label = (context, {cx, cy, w, h, text, fill, font}) => {
    let { g } = context;
    g.save();
    g.translate(-cx, -cy);
    g.font = font;
    g.textBaseline = 'middle';  
    g.fillStyle = fill;
    g.fillText(text, cx, cy, w);
    g.restore();
  }
  const renderBar = (context, value, {
    fill, columns, amountRate, stackedRate }) => {
    let { price, amount, stacked } = value;
    let a = av(amount * amountRate);
    let s = av(stacked * stackedRate);
    let cy = p2c(price);
    bar(context, {...columns[1], cy, w: columns[1].w * a, fill});
    bar(context, {...columns[2], cy, w: columns[2].w * s, fill});
  };
  const renderBarLabel = (context, value, {fill = 'white', font = '16px Airal', columns}) => {
    let { price, amount, stacked } = value;
    let cy = p2c(price);
    label(context, {...columns[0], cy, text: v(price), fill, font});
    label(context, {...columns[0], cy, text: v(amount), fill, font});
    label(context, {...columns[0], cy, text: v(stacked), fill, font});
  };
  const renderBars = (context, values, options) => // let { fill, columns, amountRate, stackedRate} = options;
    values.forEach(v => renderBar(context, v, options));
  const renderBarLabels = (context, values, options) => // let { fill, columns} = options;
    values.forEach(v => renderBarLabel(context, v, options));
  const renderCursor = (context) => {};
  const renderOverlay = (context) => {};
  const render = (context, cache) => {
    let { g, viewport, physical} = context;

    g.clearRect(0,0,physical.w, physical.h);
    g.save();
    // g.translate(-p2c(ox), -p2c(oy));

    // asks
    renderBars(context, [], {fill: 'red', columns});
    renderBarLabels(context, [], {fill: 'white', font: '16px Arial', columns});

    // bids
    renderBars(context, [], {fill: 'green', columns});
    renderBarLabels(context, [], {fill: 'white', font: '16px Arial', columns});

    // operators
    renderCursor(context, {fill: 'white', font: '16px Arial'});
    renderOverlay(context, {fill: 'white', font: '16px Arial'});

    g.restore();
  };
  const init = (context) => {
    let { book } = context;
    let cache = {};
    _(book.bids).groupBy(v => g(v.price))
    cache.sortedBids = _(book.bids).sortBy('price').reverse().value();
    cache.sortedAsks = _(book.asks).sortBy('price').reverse().value();
  };
  
  let cache = init(context);
  render(context, cache);
}

export const BookView = (props) => {
  const { 
    width = 300, height = 300, source,
  } = props;

  const canvasRef = useRef(null);
  const [book, setBook] = useState({bids:{},asks:{}});
  const [config, setConfig] = useState({
    pricePin: 10000,
    priceStep: 1,
    viewport: {w: 1, h: 1, ox: 0, oy: 0},
    physical: {w: width, h: height},
  });

  useEffect(()=>{
    const canvasObj = canvasRef.current;
    const g = canvasObj.getContext('2d');
    draw({g, config, book});
  });

  useEffect(()=>{
    var loop = setInterval(
      () => setBook(source.snapshot()), 66);
    return () => clearInterval(loop);
  },[]);

  return (
    <canvas
      ref={canvasRef}
      width={config.w}
      height={config.h}
    ></canvas>
  );
}