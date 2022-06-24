
# Electron Be Rational

A trade risk management app made with Electron to enforce [TRI](https://www.therationalinvestor.com) risk management techniques.

## To Run App Locally

In the project directory, you can run:

### `npm install`
### `npm start`

Runs the app in the development mode.
The page will reload when you make changes.
You may also see any lint errors in the console.

## App Features

The dashboard should allow you to see open trades (wip)

The trade setups managed by the app are:

1. Bracket
2. Splitter
3. LOL (TRI's 'Little Old Lady')
4. The BoT (TRI) 


![Dashboard](/renderer/images/berational.png "Dashboard")

API Settings allows storing exchange API keys in the .env file. Each trade setup requires that users Select an Exchange:

![Select Exchange](/renderer/images/berational-exch.png "Select Exchange")

Then, users must Select an Asset to trade:

![Select Asset](/renderer/images/berational-asset.png "Select Asset")

Below is the Bracket setup to enter or manage a position with target and stop orders:

![Bracket Parameters](/renderer/images/berational-bracket.png "Bracket Parameters")

Here is the Splitter setup to split orders between levels:

![Splitter Parameters](/renderer/images/berational-splitter.png "Splitter Parameters")


If something doesn't work in the future check the [Electron Breaking Changes page](https://github.com/electron/electron/blob/master/docs/api/breaking-changes.md).
