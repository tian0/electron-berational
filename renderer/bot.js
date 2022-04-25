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
  document.getElementById('exch_bot').innerHTML = ex;
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
  document.getElementById('asset_bot').innerHTML = asset;

  //Get selected exchange
  var ex = document.querySelector("#exch").value

  //Create ccxt public instance and fetch last price
  let exchange = new ccxt[ex]();
  let ticker = await exchange.fetchTicker(asset)
  let lastprice = ticker.last
  document.getElementById('price_bot').innerHTML = lastprice
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
function targets(param) {
  var a = document.getElementById('amount-input').value
  document.getElementById('total_bot').innerHTML = a;
  var e = document.getElementById('entry-input').value
  var s = document.getElementById('stop-input').value
  const risk = Number(e)-Number(s)
  const reward = Number(risk*3)
  const t = (Number(reward)+Number(e)).toFixed(8)
  document.getElementById('target_bot').innerHTML = t;
  var side = "";
  if (e > s) {
      side = "Long";
  } else if (s > e) {
      side = "Short";
  }
  return side
}
document.getElementById('entry-input').addEventListener('keyup', function() {targets(this)})
document.getElementById('amount-input').addEventListener('keyup', function() {targets(this)})


async function BoT(side) {
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
    const amount = document.getElementById('amount-input').value
    const positioned = document.getElementById('positioned').checked
    const t = document.getElementById('target_bot').innerHTML
    const enter = document.getElementById('entry-input').value
    const stop = document.getElementById('stop-input').value
    const params = {
      'stopPrice': stop, // your stop price
      'type': 'stopLimit',
    }
    //Send entry order if not positioned
    if (positioned) {      
        //const order = await exchange.createOrder(s, type, side, amount, enter, params)
    }

    //Calculate strat variables
    const risk = Number(enter)-Number(stop)
    var t1 = (Number(risk) + Number(enter)).toFixed(8)
    var t2 = (Number(0.66 * 3 * risk) + Number(enter)).toFixed(8)
    var t3 = t

    var iter = 0;
    var botBroke = 0;
    
    let count = { 
        countStop: 0,
        countEntry: positioned?1:0, //if positioned checkbox true, init true, countEntry=1
        countT1: 0, //t1,t2,t3 initialized to 0. over/under checks left to strategy_logic.js
        countT2: 0,
        countT3: 0
    }

        let request = async () => {
    
            //FETCH INDEX
            var index = await price(this)
            // console.log(index)
    
            //RUN STRATEGY LOGIC
            switch (side) {
                case "buy":
    
                    if (index <= stop) {
                        count.countStop++
                    } else if (index >= t3) {
                        count.countT3++
                        // console.log(count.countT3)
                    } else if (index >= t2) {
                        count.countT2++
                        // console.log(count.countT2)
    
                    } else if (index >= t1) {
                        count.countT1++
                        // console.log(count.countT1)
    
                    } else if (index >= enter) {
                        count.countEntry++
                        // console.log(count.countEntry)
                    } else if (index < enter && index > stop) {
                        console.log('In the Bot 3-low setting zone | BTC index at: ', index)
                    }
    
                    if (count.countStop == 1) {
                        var stopOrder = await sell(credentials, amount, side)
                            .then(() => {
                                console.log("Stop hit, Bot broken at: ", stop)
                                botBroke++;
                            })
                            .catch(() => {
                                console.log("Error placing Sell-cover order")
                            })
                    } else if (count.countEntry == 1) {
                        const entryOrder = await buy(credentials, amount, side)
                            .then(() => {
                                console.log("Long Bot Live from: ", enter, "  Initial Stop at: ", stop, "   Target1 at: ", t1)
                            })
                            .catch(() => {
                                console.log("Error placing Long order")
                            })
                    } else if (count.countEntry > 1) {
                        if (count.countT3 == 1) {
                            stop = t2;
                            console.log('100%% level hit: ', enter, ' | Moving stop to TRAILING: ', stop, ' | BTC index at: ', index)
                        }
                        else if (count.countT3 >= 2) {
                            if (index < t3) {
                                trailStop = ((t2) + index - (t3)).toFixed(2) //toFixed makes this number a string
                                if (trailStop > stop) {
                                    stop = trailStop
                                }
                            }
                            console.log('Long Bot 100% hit: ', t3, ' | Stop is TRAILING: ', stop, ' | BTC index at: ', index)
                        }
                        else if (count.countT2 == 1) {
                            stop = t1;
                            console.log("66% level hit: ", t2, "   Moving stop to 50%: ", stop)
                        }
                        else if (count.countT2 >= 2) {
                            console.log('Long Bot Live from: ', enter, ' | Stop is PROFIT: ', stop, ' | BTC index at: ', index)
                        }
                        else if (count.countT1 == 1) {
                            stop = enter;
                            console.log("50% level hit: ", t1, "   Moving stop to Breakeven: ", stop)
                        }
                        else if (count.countT1 >= 2) {
                            console.log('Long Bot Live from: ', enter, ' | Stop is Breakeven: ', stop, ' | BTC index at: ', index)
                        }
                    } return
    
                case "sell":
                    // if (count.countStop == 1) { return }
                    if (index >= stop) {
                        count.countStop++
                    } else if (index <= t3) {
                        count.countT3++
                        // console.log("countT3", count.countT3)
    
                    } else if (index <= t2) {
                        count.countT2++
                        // console.log("countT2", count.countT2)
    
                    } else if (index <= t1) {
                        count.countT1++
                        // console.log("countT1", count.countT1)
    
                    } else if (index <= enter) {
                        count.countEntry++
                        // console.log("countEntry", count.countEntry)
                    } else if (index > enter && index < stop) {
                        console.log('In the Bot 3-high setting zone | BTC index at: ', index)
                    }
                    
                    if (count.countStop == 1) {
                        var stopOrder = await buy(credentials, amount, side)
                        .then(()=>{
                            console.log("Stop hit, Bot broken at: ", stop)
                            botBroke++;
                        })
                        .catch(()=>{
                            console.log("Error placing Buy-cover order")
                        })
                    } else if (count.countEntry == 1) {
                        const entryOrder = await sell(credentials, amount, side)
                        .then(()=>{
                            console.log("Short Bot Live from: ", enter, "  Initial Stop at: ", stop, "   Target1 at: ", t1)
                        })
                        .catch(()=>{
                            console.log("Error placing Short order")
                        })
                    } else if (count.countEntry > 1) {
                        if (count.countT3 == 1) {
                            stop = t2;
                            console.log('100%% level hit: ', enter, ' | Moving stop to TRAILING: ', stop, ' | BTC index at: ', index)
                        }
                        else if (count.countT3 >= 2) {
                            if (index < t3) {
                                trailStop = ((t2) + index - (t3)).toFixed(2) //toFixed makes this number a string
                                if (trailStop > stop) {
                                    stop = trailStop
                                }
                            }
                            console.log('Short Bot 100% hit: ', t3, ' | Stop is TRAILING: ', stop, ' | BTC index at: ', index)
                        }
                        else if (count.countT2 == 1) {
                            stop = t1;
                            console.log("66% level hit: ", t2, "   Moving stop to 50%: ", stop)
                        }
                        else if (count.countT2 >= 2) {
                            console.log('Short Bot Live from: ', enter, ' | Stop is PROFIT: ', stop, ' | BTC index at: ', index)
                        }
                        else if (count.countT1 == 1) {
                            stop = entry;
                            console.log("50% level hit: ", t1, "   Moving stop to Breakeven: ", stop)
                        }
                        else if (count.countT1 >= 2) {
                            console.log('Short Bot Live from: ', enter, ' | Stop is Breakeven: ', stop, ' | BTC index at: ', index)
                        }
                    }
                    else {
                        console.log(count)
                    } return
    
            }
            iter++
    
            console.log({
                "Entry": enter,
                "Stop": stop,
                "Counts": count,
                "PnL": pnl,
            })
        }
        this._interval = setInterval(() => {
            var price = request();
            if (count.countStop > 0 || botBroke > 0) {
                console.log('Bot Broke at ', stop);
                clearInterval(this._interval);
                return process.exit(1)
            }
        }, 3000);
    }
    

    var logObj = {
      "setup": "BoT",
      "exchange": ex,
      "symbol": s,
      "type": type,
      "side": "buy",
      "stop": stop
    }
    return logObj
  }

document.getElementById('long-bot').addEventListener('click', async function(e){ 
  e.preventDefault(); 
  await BoT(targets())
    .then((result) => {
      e.preventDefault();
      //log.info(result); //reloads app
      alert("Successful BoT. Verify your orders on the selected Exchange")
    })
    .catch((err) => {
      console.log(err.message);
      alert("Error: Exchange API error. Make sure your API credentials and trade inputs are correct");
    });
})

document.getElementById('short-bot').addEventListener('click', async function(e){ 
    e.preventDefault(); 
    await BoT(target(this))
      .then((result) => {
        e.preventDefault();
        //log.info(result); //reloads app
        alert("Successful BoT. Verify your orders on the selected Exchange")
      })
      .catch((err) => {
        console.log(err.message);
        alert("Error: Exchange API error. Make sure your API credentials and trade inputs are correct");
      });
  })