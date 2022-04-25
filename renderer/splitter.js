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
  document.getElementById('exch_split').innerHTML = ex;
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
  document.getElementById('asset_split').innerHTML = asset;

  //Get selected exchange
  var ex = document.querySelector("#exch").value

  //Create ccxt public instance and fetch last price
  let exchange = new ccxt[ex]();
  let ticker = await exchange.fetchTicker(asset)
  let lastprice = ticker.last
  document.getElementById('price_split').innerHTML = lastprice
  return lastprice
}
document.getElementById("asset").addEventListener('change', async function() { await price(this)
  .then(()=>{
  })
  .catch((err)=>{
    alert('Cannot fetch Price for this Exchange')
  })
})

//On Input keyup: populate Amount/Order size and return split order size
function size(param) {
  var sp = document.getElementById('split-input').value
  var a = document.getElementById('amount-input').value
  var o = (a/sp).toFixed(8);
  document.getElementById('order_split').innerHTML = o;
  document.getElementById('total_split').innerHTML = a;
  return o
}
document.getElementById('split-input').addEventListener('keyup', function() {size(this)})
document.getElementById('amount-input').addEventListener('keyup', function() {size(this)})


async function Split(side) {
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
    const type = 'limit' // or 'market'
    const symbol = document.getElementById('asset');
    const s = symbol.options[symbol.selectedIndex].text //symbol in string format
    const amount = document.getElementById('order_split').innerHTML //string
    const u = document.getElementById('upper-input').value
    const l = document.getElementById('lower-input').value
    const sp = document.getElementById('split-input').value
    const stop = document.getElementById('stop-input').value
    const params = {
      'stopPrice': stop, // your stop price
      'type': 'stopLimit',
    }
  
    //Calc order prices
    const delta = (u - l) / (sp - 1)
    var prices = []
    for (var i = 0; i < sp; i++) {
      p = u - delta * i
      prices.push(p)
      //const order = await exchange.createOrder(s, type, side, amount, p, params)
      //console.log(order);
    }
  
    var logObj = {
      "setup": "splitter",
      "exchange": ex,
      "symbol": s,
      "type": type,
      "side": side,
      "stop": stop
    }
    return logObj
  }

document.getElementById('long-split').addEventListener('click', async function(e){ 
  e.preventDefault(); 
  const side = 'buy';
  await Split(side)
    .then((result) => {
      e.preventDefault();
      //console.log(result);
      log.info(JSON.parse(result)); //reloads app
      alert("Successful Split. Verify your orders on the selected Exchange")
    })
    .catch((err) => {
      console.log(err.message);
      alert("Error: Exchange API error. Make sure your API credentials and trade inputs are correct");
    });
})

document.getElementById('short-split').addEventListener('click', async function(e){ 
  e.preventDefault(); 
  const side = 'sell';
  await Split(side)
    .then((result) => {
      e.preventDefault();
      //log.info(result); //reloads app
      alert("Successful Split. Verify your orders on the selected Exchange")
    })
    .catch((err) => {
      console.log(err.message);
      alert("Error: Exchange API error. Make sure your API credentials and trade inputs are correct");
    });
})

