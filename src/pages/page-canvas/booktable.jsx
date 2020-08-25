import React, {useRef, useState, useEffect} from 'react';
import {subscribeBook as subscribe} from '../../core/applications';
import _ from 'lodash';

const DELTA_MIN = 5;
const DELTA_MAX = 100;
const BUFFER_SIZE = 400;

const sum = (list, index, middle) => {

  if (index < middle)
    return _(list)
      .slice(index, middle)
      .sumBy(l => l.cob);
  
  if (index > middle)
    return _(list)
      .slice(middle-1, index)
      .sumBy(l => l.cob);
  
  return list[middle].cob;
}

const arrange = (book) => 
  _(book)
    .toArray()
    .sortBy(['price'])
    .value()
    .reverse();

const gap = (value, deltaOffset) =>
  parseInt(Math.round(parseFloat(value) / deltaOffset) * deltaOffset);

const convertBlocks = (book, config) => {
  let {delta, deltaOffset} = config;
  
  let arrangedBook = arrange(book);
  let dealedItem = _.find(arrangedBook, v => v.amount >= 0);
  if(!dealedItem) return [];

  let priceDealed = dealedItem.price;
  let indexOfMiddle = delta;
  let middle = gap(priceDealed, deltaOffset);
  let min = middle - (delta * deltaOffset);
  let max = middle + delta * deltaOffset;
  let values = _.range(min, max, deltaOffset);
  let blocks = values.map(v => ({price: v, cob: 0, cob_ag: 0})).reverse();

  blocks.forEach(block => {
    block.cob = _(arrangedBook)
      .filter(book => gap(book.price, deltaOffset) == block.price)
      .sumBy(book => book.amount);
  });

  blocks.forEach((block, index) => {
    block.cob_ag = sum(blocks, index, indexOfMiddle);
  });

  return blocks;
}

const drawTable = (ctx, config, book) => {
  let blocks = convertBlocks(book, config);
  if(blocks.length == 0) return;
  let {delta,height} = config;

  let blockHeight = height / blocks.length;
  let cobMax = _.maxBy(blocks, b => b.cob).cob;
  let cobAgMax = _.maxBy(blocks, b => b.cob_ag).cob_ag;

  let fieldLeft = config.width - 300;

  blocks.forEach((block, index) => {
    let { price, cob, cob_ag } = block;
    let posX = fieldLeft;
    let posY = index * blockHeight;
    let posTxtY = index * blockHeight + blockHeight * 0.5;
    let fieldW = 100;
    let fieldH = blockHeight;
    let cobRate = Math.abs(cob / cobMax);
    let cobAgRate = Math.abs(cob_ag / cobAgMax);
    let color = index < delta - 1 ? 'red' : 'green';

    ctx.save();

    ctx.fillStyle = '#333333';
    ctx.fillRect(posX, posY, fieldW, fieldH);
    ctx.fillRect(posX + fieldW*1, posY, fieldW, fieldH);
    ctx.fillRect(posX + fieldW*2, posY, fieldW, fieldH);

    // percentage
    ctx.fillStyle = color;
    ctx.fillRect(posX + fieldW*1, posY, fieldW * cobRate, fieldH);
    ctx.fillRect(posX + fieldW*2, posY, fieldW * cobAgRate, fieldH);

    ctx.font = ['bold',`${fieldH > 20 ? 16 : parseInt(fieldH * 0.8)}px`,'Arial'].join('');
    ctx.textBaseline = 'middle';  
    ctx.fillStyle = 'white';
    ctx.fillText(price, posX + 10, posTxtY, 100);
    ctx.fillText(_.round(cob, 10), posX + fieldW*1 + 10, posTxtY, 100);
    ctx.fillText(_.round(cob_ag, 10), posX + fieldW*2 + 10, posTxtY, 100);

    if(index == delta-1){
      ctx.strokeStyle = 'yellow';
      ctx.strokeRect(posX, index * blockHeight, fieldW * 3, fieldH - 1);
    }

    ctx.restore();
  });
}

const drawDepth = (ctx, config, book) => {
  let { posX, fieldWidth, height } = config;

  let blocks = convertBlocks(book, config);
  if(blocks.length == 0) return;

  let blockHeight = height / blocks.length;
  let cobMax = _.maxBy(blocks, b => b.cob).cob;
  let cobAgMax = _.maxBy(blocks, b => b.cob_ag).cob_ag;

  blocks.forEach((block,index) => {
    let cobRate = block.cob / cobMax;
    let cobAgRate = block.cob_ag / cobAgMax;
    let rate = cobRate;
    let rateAbs = Math.abs(rate);
    ctx.save();

    ctx.fillStyle = `rgba(${rate >= 0 ? 0 : 128},${rate >= 0 ? 128 : 0},128,${rateAbs})`;
    ctx.fillRect(posX, blockHeight * index, fieldWidth, blockHeight);

    ctx.restore();
  });
}

const drawHistory = (ctx, config, books) => {
  let startPos = config.width - 300;
  let reversedBooks = [...books].reverse();
  let index = 0;
  while(index < config.width - 400) {
    let book = reversedBooks[index];
    drawDepth(
      ctx, 
      {
        ...config, 
        posX: startPos - (100 + index), 
        fieldWidth: index == 0 ? 100 : 1
      }, 
      book);
    index++;
  }
  ctx.save();
  ctx.clearRect(startPos - 100, 0, 1, config.height);
  ctx.restore();
}

const draw = (ctx, config, state) => {
  let {book, books} = state;
  drawTable(ctx, config, book);
  drawHistory(ctx, config, books);
}


export const BookTable = (props) => {
  const {width, height} = props;
  const canvasRef = useRef(null);

  // data
  const [state, setState] = useState({book: {}, books: []});
  const [delta, setDelta] = useState(20);
  const [deltaOffset, setDeltaOffset] = useState(1);
  const [dragStart, setDragStart] = useState(null);

  const onBookUpdate = data => {
    setState(state => {
      let updatedBook = {...state.book, ...data};
      let updatedBooks = [...state.books, updatedBook];
      if(updatedBooks.length > BUFFER_SIZE)
        updatedBooks = _.slice(updatedBooks, updatedBooks.length - BUFFER_SIZE, updatedBooks.length);
      return ({
        book: updatedBook,
        books: updatedBooks,
      })
    });
  };

  useEffect(()=>{
    let latestBook = {};
    subscribe(data => {
      latestBook = {...latestBook, ...data};
    });

    setInterval(()=>{
      onBookUpdate(latestBook);
    }, 66);
  }, []);
  
  useEffect(()=>{
    const canvasObj = canvasRef.current;
    const ctx = canvasObj.getContext('2d');
    ctx.clearRect(0,0,width,height);

    draw(ctx, {delta,deltaOffset,width,height}, state);
  });  

  return (
    <canvas
      style={props.style}
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={e => {
        setDragStart({delta: delta, x: e.clientX, y: e.clientY})
      }}
      onMouseMove={e => {
        if(!dragStart) return;
        let offsetDirection = (dragStart.y > height / 2) ? -1 : 1;
        let cur = {x: e.clientX, y:e.clientY};
        let deltaOffset = parseInt((cur.y - dragStart.y) * 0.5);
        let deltaUpdate = dragStart.delta + offsetDirection * deltaOffset;
        if(deltaUpdate < DELTA_MIN) deltaUpdate = DELTA_MIN;
        if(deltaUpdate > DELTA_MAX) deltaUpdate = DELTA_MAX;
        setDelta(deltaUpdate);
      }}
      onMouseUp={e => {
        if(!dragStart) return;
        setDragStart(null);
      }}
    ></canvas>
  );
}