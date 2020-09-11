import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import { PageH5 } from './pages/deprecated/page-h5';
import { PageBitfinex } from './pages/page-bitfinex';
import { PageBinance } from './pages/page-binance';
import { PageCoinBase } from './pages/page-coinbase';
import { PageMix } from './pages/page-mix';
import { PageDashboard } from './pages/page-dashboard';

import './App.css';

const pages = [
  // { n: 'H5', p: '/page-h5', c: PageH5 },
  // { n: 'BITFINEX', p: '/page-bitfinex', c: PageBitfinex },
  // { n: 'BINANCE', p: '/page-binance', c: PageBinance },
  // { n: 'COINBASE', p: '/page-coinbase', c: PageCoinBase },
  { n: 'ALL', p: '/page-mix', c: PageMix },
  { n: 'DASHBOARD', p: '/page-dashboard', c: PageDashboard}
];

export const PageHome = (props) =>
  <div>
    <ul>
      {pages.map(p => <li><Link to={p.p}>{p.n}</Link></li>)}
    </ul>
  </div>

export default () => {
  return (
    <Router>
      <nav>
        <ul>
          {pages.map(p => <li><Link to={p.p}>{p.n}</Link></li>)}
        </ul>
      </nav>

      <div className="content">
        <Switch>
          <Route path="/home" component={PageHome} />
          {pages.map(p => <Route path={p.p} component={p.c} />)}
        </Switch>
      </div>
    </Router>
  );
}