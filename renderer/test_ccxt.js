const ccxt = require('ccxt')

const binance = new ccxt.binance();
const bittrex = new ccxt.bittrex();
const coinbase = new ccxt.coinbase();
const bitmex = new ccxt.bitmex();
const ftx = new ccxt.ftx();
const deribit = new ccxt.deribit();
const huobipro = new ccxt.huobipro();
const bybit = new ccxt.bybit();
const kucoin = new ccxt.kucoin();
const kraken = new ccxt.kraken();



console.log (binance.hasCreateMarketOrder)
console.log (bittrex.hasCreateMarketOrder)
console.log (coinbase.hasCreateMarketOrder)
console.log (bitmex.hasCreateMarketOrder)
console.log (ftx.hasCreateMarketOrder)
console.log (deribit.hasCreateMarketOrder)
console.log (huobipro.hasCreateMarketOrder)
console.log (bybit.hasCreateMarketOrder)
console.log (kucoin.hasCreateMarketOrder)
console.log (kraken.hasCreateMarketOrder)

