import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import { PageH5 } from './pages/page-h5';
import { PageBitfinex } from './pages/page-bitfinex';
import { PageBinance } from './pages/page-binance';
import { PageBookViewer } from './pages/page-book-viewer';

import './App.css';

export const PageHome = (props) =>
  <div>
    <div style={{padding: 20}}>
      <a href="/page-h5">HTML5</a>
      <a href="/page-canvas">CANVAS</a>
      <a href="/page-binance">BINANCE</a>
    </div>
    <div style={{padding: 20}}>
      {props.children}
    </div>
  </div>

export default ()=>
  <Router>
    <nav>
      <ul>
        <li>
          <Link to="/page-bitfinex">BITFINEX</Link>
        </li>
        <li>
          <Link to="/page-binance">BINANCE</Link>
        </li>
        <li>
          <Link to="/page-book-viewer">BOOK VIEWER</Link>
        </li>
      </ul>
    </nav>

    <div className="content">
      <Switch>
        <Route path="/home" component={PageHome} />
        <Route path="/page-h5" component={PageH5} />
        <Route path="/page-bitfinex" component={PageBitfinex} />
        <Route path="/page-binance" component={PageBinance} />
        <Route path="/page-book-viewer" component={PageBookViewer} />
      </Switch>
    </div>
  </Router>