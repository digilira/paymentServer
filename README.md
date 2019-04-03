# paymentServer
digilira Payment Application

## Get Started

### Overview

This page introduces you to the things you’ll need to get started to accept crypto payments with WAVES and WAVES Assets.

You’ll be able to

-	The owner of an internet store writes data to Waves Blockchain as data transactions to prevent fraud and make payment application decentralized. Payment application checks the prices from the Waves Blockchain thus making application more secure against cheats on false price payment attempts.
-	Payment application checks prices from the Waves DEX with the current bids. This makes crypto calculations more accurately. If there are not enough bids for that pair then payment application prevents vendor in case of low liquidity situations.
-	The vendor can determine the products price in fiat currencies or any tokens issued on the Waves Platform. Vendor of an internet store will write the products price on the waves blockchain as data transactions and vendor will be able to change the prices later.
-	The vendor can set up a list of tokens accepted as payment.
-	The exchange rates for tokens will be calculated from Waves DEX automatically.
-	Payment application is integrated with the Waves Keeper. If the customer is not using Waves Keeper then payment application generates a QR code to pay from waves desktop or online wallet.
-	Payment application can confirm the transactions made from waves keeper and also application has ability to scan blockchain to confirm transactions made from mobile or desktop wallet.
-	Vendor can set a payment time deadline to prevent from price volatility. 

Things You’ll Need

NodeJS (First, access Node.js website and click the green "Download" button for your OS)

Waves Keeper

Step by Step Accepting Crypto Payments

1. Create a “payment” folder on your server

2. Download these 3 files from GitHub:
-	server.js
-	config.Js
-	package.json

2.1. Configure config.js :


    address: {
        node: 'https://nodes.wavesplatform.com',
        matcher: 'https://matcher.wavesplatform.com',
        wallet: '3PPwkvZnzicSGCzJdqMj7TsphVstMT4EXN9',
    },
    
    accepted: {
        WAVES: 'WAVES',
        BTC: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
        ETH: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
        TRY: '2mX5DzVKWrAJw8iwdJnV2qtoeVG9h5nTDpTqC1wb1WEN',
        LTC: 'HZk1mbfuJpmxU1Fs4AX5MWLVYtctsNcg6e2C6VKqK8zk',
    },
    
    exchange: {
        dataServices: 'https://api.wavesplatform.com/v0/pairs',
    }, 
 

2.1.1. Change wallet address with your Waves Address which you will accept crypto payments. This account must be the same account you added to Waves Keeper and must have Waves Balance (You will use data transactions to write data on Waves Blockchain).

2.1.2. Change accepted crypto currencies which you want to accept. You can add or remove any crypto currencies created on Waves Blockchain. You must write Asset identifier and Asset ID.

3. Configure server.js

Server.js supports SSL connections. To activate SSL connections add following lines to options in server.js and edit SSL certificate locations.

```
var options = {
  key: fs.readFileSync('…'),
  cert: fs.readFileSync('…'),
  ca: fs.readFileSync('…') 
}
```

Next you need to change http server to https;

      var server = https.createServer(options, app);
      to 
      var server = https.createServer(options, app);

4. Run respectively;
```
npm install

node server.js
```
5. You should see following on terminal window;
```
socket
server up and running at 8080 port
```




