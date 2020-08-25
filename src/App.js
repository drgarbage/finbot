import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import { PageH5 } from './pages/page-h5';
import { PageCanvas } from './pages/page-canvas';
import { PageBinance } from './pages/page-binance';

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
          <Link to="/page-h5">HTML5</Link>
        </li>
        <li>
          <Link to="/page-canvas">CANVAS</Link>
        </li>
        <li>
          <Link to="/page-binance">BINANCE</Link>
        </li>
      </ul>
    </nav>

    <div class="content">
      <Switch>
        <Route path="/home" component={PageHome} />
        <Route path="/page-h5" component={PageH5} />
        <Route path="/page-canvas" component={PageCanvas} />
        <Route path="/page-binance" component={PageBinance} />
      </Switch>
    </div>
  </Router>