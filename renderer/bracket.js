const path = require("path");
const ccxt = require("ccxt");
const log = require("electron-log");
require("dotenv").config();
log.transports.file.resolvePath = () => path.join("renderer", 'main.log');

//On Load populate Exchange drowndown with data
window.onload = populate(getExchanges())

function getExchanges() {
    const data = ccxt.exchanges
    return data
}

function populate(data) {
    var ele = document.getElementById('exch');
    for (var i = 0; i < data.length; i++) {
      // Bind data to <select> element.
      ele.innerHTML = ele.innerHTML + '<option value="' + data[i]+ '">' + data[i] + '</option>';
    }
}

//On Exchange change: populate Asset dropdown
async function getAssets() {
  //Get selected exchange
  var ex = document.querySelector("#exch").value
  
  //Create ccxt instance and fetch markets
  let exchange = new ccxt[ex]();
  let assets = await exchange.fetchMarkets();

  //Boil down asset request, sort
  var markets = []
  Object.keys(assets).forEach(key => {
      var obj = assets[key].symbol
      markets.push(obj)
  })
  markets.sort()
  console.log(markets);

  //Populate dropdown
  var ele = document.getElementById('asset');
  ele.innerHTML = ""
  //Makes dropdown default a null entry in form validation
  ele.innerHTML = '<option value="">-- Select Asset --</option>'
  for (var i = 0; i < markets.length; i++) {
    // Bind data to <select> element.
    ele.innerHTML = ele.innerHTML + '<option value="' + markets[i] + '">' + markets[i] + '</option>';
  }
  document.getElementById('exch_bracket').innerHTML = ex;
}
document.getElementById("exch").addEventListener('change', async function() { await getAssets()
  .then(()=>{})
  .catch((err)=>{
    alert('Cannot fetch Assets for this Exchange')
  })
})

//On Asset change: populate Asset/Last Price and return price
async function price(ele) {

  // Get the selected value from <select> element
  var asset = ele.options[ele.selectedIndex].text;
  document.getElementById('asset_bracket').innerHTML = asset;

  //Get selected exchange
  var ex = document.querySelector("#exch").value

  //Create ccxt public instance and fetch last price
  let exchange = new ccxt[ex]();
  let ticker = await exchange.fetchTicker(asset)
  let lastprice = ticker.last
  document.getElementById('price_bracket').innerHTML = lastprice
  return lastprice
}
document.getElementById("asset").addEventListener('change', async function() { await price(this)
  .then(()=>{})
  .catch((err)=>{
    alert('Cannot fetch Price for this Exchange')
  })
})

//On Input keyup: populate riskreward ratio
function rr(param) {
  var e = document.getElementById('bracket-entry-input').value
  var s = document.getElementById('bracket-stop-input').value
  var t = document.getElementById('bracket-target-input').value
  var rr = (Math.abs(t-e)/Math.abs(e-s)).toFixed(2);
  document.getElementById('rnr_bracket').innerHTML = rr;
  return rr
}
document.getElementById('bracket-target-input').addEventListener('keyup', function() {rr(this)})
document.getElementById('bracket-stop-input').addEventListener('keyup', function() {rr(this)})


async function Bracket(side) {
    //Instantiate exchange
    var e = document.querySelector("#exch")
    const ex = e.value;
    let keypath = ex.concat('_', 'KEY')
    let secretpath = ex.concat('_', 'SECRET')

    let exchange = new ccxt[ex] ({
      'apiKey': process.env[keypath],
      'secret': process.env[secretpath],
      'enableRateLimit': true,
    })
  
    //Define order inputs
    const type = 'limit'
    const symbol = document.getElementById('asset');
    const s = symbol.options[symbol.selectedIndex].text //symbol in string format
    const amount = document.getElementById('bracket-amount-input').value //string
    const entry = document.getElementById('bracket-entry-input').value
    const stop = document.getElementById('bracket-stop-input').value
    const target = document.getElementById('bracket-target-input').value
    const params = {
      'stopPrice': stop, // stop price
      'type': 'stopLimit',
    }
    //Define target side for unwind
    let unwind = (side == "buy") ? "sell" : "buy";

    var tradeEntryOrder = {
      "symbol": s,
      "type": type,
      "side": side,
      "amount": amount,
      "price": entry,
      "params": params
    }
    //const entryOrder = await exchange.createOrder(s, type, side, amount, entry, params)
    //console.log(entryOrder);

    var tradeExitOrder = {
      "symbol": s,
      "type": type,
      "side": unwind,
      "amount": amount,
      "price": target,
    }
    //const exitOrder = await exchange.createOrder(s, type, unwind, amount, target)
    //console.log(exitOrder);

    var logObj = {
      "setup": "bracket",
      "exchange": ex,
      "symbol": s,
      "type": type,
      "side": side,
      "stop": stop,
    }
    return logObj
  }

document.getElementById('long-bracket').addEventListener('click', async function(e){ 
  e.preventDefault(); 
  const side = 'buy';
 await Bracket(side)
    .then((result) => {
      e.preventDefault();
      //log.info(result); //reloads app
      alert("Successful Long Bracket. Verify your orders on the selected Exchange")
    })
    .catch((err) => {
      console.log(err);
      alert("Error: Exchange API error. Make sure your API credentials and trade inputs are correct");
    });
})

document.getElementById('short-bracket').addEventListener('click', async function(e){ 
  e.preventDefault(); 
  const side = 'sell';
  await Bracket(side)
    .then((result) => {
      e.preventDefault();
      //log.info(result); //reloads app
      alert("Successful Short Bracket. Verify your orders on the selected Exchange")
    })
    .catch((err) => {
      console.log(err.message);
      alert("Error: Exchange API error. Make sure your API credentials and trade inputs are correct");
    });
})

