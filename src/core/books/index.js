// const model = {
//   id: 0,
//   bids: {},
//   asks: {}
// }

export class Book {
  connect(symbol){}
  disconnect(){}
  snapshot(){return [];}
}

export const Symbols = {
  BTCUSD: 'BTC:USD',
  BTCUSDT: 'BTC:USDT',
  ETHUSD: 'ETH:USD',
  ETHUSDT: 'ETH:USDT',
}