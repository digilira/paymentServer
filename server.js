var express = require('express');
var socket = require('socket.io');
const axios = require("axios");
const pdftk = require('node-pdftk');
var https = require('https');
var http = require('http');
var fs = require('fs');
var app = express();
var config1 = require('./config');
const uuidv1 = require('uuid/v1');
Base58 = require("base-58");

assetList = [];

var options = {
    //key: fs.readFileSync('...'),
    //cert: fs.readFileSync('...'),
    //ca: fs.readFileSync('...')
};

for (var key in config1.accepted) {
    if (config1.accepted[key] != "WAVES") {
        loadAsset(config1.accepted[key]);
    }
}

var server = http.createServer(options, app);
const io = socket(server);

server.listen(8080, function () {
    console.log('server up and running at 8002 port');

});

console.log('socket');

io.on('connection', function (socket) {
    var socketId = socket.id;
    var clientIp = socket.request.connection.remoteAddress;

    console.log(clientIp, socketId);

    socket.on('data', function (buf) {
        console.log(buf);
        var js = JSON.parse(buf);
        io.emit(js.msg, js.data); //Send the msg to socket.io clients
    });

    socket.on('blockchain', async function (buf) {
        var price = await checkBlockchain(buf.key, 0)
        console.log(price[0]);
        io.sockets.connected[socket.id].emit('onay', price[0]);

    });

    socket.on('qrcodePay', async function (data) {
        app.get('./dekont.pdf', (req, res, next) => {
            pdftk
                .input('./dekont.pdf')
                .fillForm({
                    txt_tarih: 'data'
                })
                .flatten()
                .output('./test.pdf')
                .then(buf => {
                    res.type('application/pdf');
                    res.send(buf);
                })
                .catch(next);
        });

        console.log(data.islemid);
        var a = await checkBlockchain(data, 0);
        io.sockets.connected[socket.id].emit('onay', a);
    });

    socket.on('fetch', async function (data) {
        console.log(data);
        var a = await fetchData(config1.address.wallet);
        io.sockets.connected[socket.id].emit('fetch', a);
    });

    socket.on('onay', async function (data) {
        console.log(data.product);
        var dict = JSON.parse(data.transfer);
        var a = await checkKeeperTrx(dict['id']);
        var result = [a, data.product, "PAYMENT-" + data.product];
        io.sockets.connected[socket.id].emit('onay', a[0]);
    });

    socket.on('admin', async function (data) {
        var value = Buffer.from(JSON.stringify(data)).toString('base64');
        params = {
            type: 'string',
            key: "PRODUCT-" + uuidv1(),
            value: value,
        }
        console.log(params);
        io.sockets.connected[socket.id].emit('dataTrx', params);

    });

    socket.on('editItem', async function (data) {
        var value = Buffer.from(JSON.stringify(data)).toString('base64');
        console.log(data);
        params = {
            type: 'string',
            key: data.data.id,
            value: value,
        }
        console.log(params);
        io.sockets.connected[socket.id].emit('dataTrx', params);

    });


    socket.on('fiyat', async function (data) {

        for (var key in config1.accepted) { 
            if (config1.accepted[key] == data.priceAsset) {
                var price = await orderbook(config1.accepted[key], data.amountAsset, data.price, key);
            }
        }
        var uuid = uuidv1(),
            params = {
                div: data.key,
                item: data.item,
                para: price[0],
                coin: price[1],
                adres: config1.address.wallet,
                asset: data.priceAsset,
                uuid: uuid,
                qrcode: "https://client.wavesplatform.com/#send/" + data.priceAsset + "?recipient=" + config1.address.wallet + "&amount=" + price[0] + "&attachment=" + uuid + "&strict",
            }
        console.log(params);
        io.sockets.connected[socket.id].emit('result1', params);

    });

});


function fetchAsset(ASSETID) {

    return new Promise(function (resolve, reject) {
        try {
            const url = config1.address.node + "/assets/details/" + ASSETID;
            const getData = async url => {
                try {
                    const response = await axios.get(url);
                    const data = response.data;
                    resolve((data));
                } catch (error) {
                    console.log(error);
                }
            };
            getData(url);
        } catch (error) {
            console.log(error);
        }
    })
}


function orderbook(AMOUNT, PRICE, DEAL, NAME) {
    return new Promise(function (resolve, reject) {
        try {
            amountDecimals = 0;
            priceDecimals = 0;
            amountAssetName = "";
            priceAssetName = "";

            assetList.forEach(function (element) {
                if (element.assetId == AMOUNT) {
                    amountDecimals = element.decimals
                    amountAssetName = element.name;

                };
                if (element.assetId == PRICE) {
                    priceDecimals = element.decimals
                    priceAssetName = element.name;
                };
            });

            if (AMOUNT == 'WAVES') {
                amountDecimals = 8;
                amountAssetName = 'WAVES';
            }
            if (PRICE == 'WAVES') {
                priceDecimals = 8;
                priceAssetName = 'WAVES';

            }

            if (AMOUNT == PRICE) {

                var price = (DEAL);
                dict = [price, priceAssetName];

                resolve(dict); //RETURN PRICE
                return true;
            }

            const url = config1.address.matcher + "/matcher/orderbook/" + AMOUNT + "/" + PRICE;

            const getData = async url => {
                try {
                    const response = await axios.get(url);
                    var pair = response.data['pair'];

                    var asks = response.data['asks'];
                    var bids = response.data['bids'];

                    amountAsset = pair['amountAsset'];
                    priceAsset = pair['priceAsset'];
 
                    //console.log(asks);
                    var base = 0;
                    asks.some(function (element) {

                        base += element['amount'] / 10 ** priceDecimals;
                        console.log(base, DEAL);
                        if (base > parseFloat(DEAL)) {
 
                            console.log(DEAL, PRICE, AMOUNT, element['price'], amountDecimals);
                            if (AMOUNT == amountAsset) {
                                var price = (DEAL) / (element['price'] / 10 ** priceDecimals);
                                dict = [price.toFixed(amountDecimals), amountAssetName];
                                console.log("STRAIGHT");
                            }
                            if (AMOUNT == priceAsset) {
                                var price = (DEAL) * (element['price'] / 10 ** amountDecimals);
                                dict = [price.toFixed(amountDecimals), amountAssetName];
                                console.log("CROSSED");
                            }

                            resolve(dict); //RETURN PRICE
                            return true;
                        }
                    });
                    if (base < parseFloat(DEAL)) {
                        console.log('NOT ENOUGH DEPTH');
                        dict = ['E0', 'NOT ENOUGH DEPTH'];

                        resolve(dict); //RETURN PRICE
                        return true;
                    }

                } catch (error) {
                    console.log(error);

                }
            };
            getData(url);
        } catch (error) {
            console.log(error);
        }
    })


}


async function loadAsset(ASSETID) {

    let promise = new Promise((resolve, reject) => {
        var details = fetchAsset(ASSETID);
        resolve(details);
    });
    let result = await promise; // wait till the promise resolves (*)
    assetList.push(result);
}


async function fetchData(WALLET) {

    return new Promise(function (resolve, reject) {
        try {
            const url = config1.address.node + "/addresses/data/" + WALLET;
            const getData = async url => {
                try {
                    const response = await axios.get(url);
                    const data = response.data;
                    var dict = [];
                    var main = [];
                    data.forEach(function (element) {
                        var arr = element.key.split("-");
                        if (arr[0] == "PRODUCT") {
                            //console.log(assetList);
                            var decoded = new Buffer.from(element.value, 'base64').toString();
                            var js = JSON.parse(decoded);
                            assetList.forEach(function (element) {
                                if (element.assetId == js["data"]["coin"]) {
                                    js["data"]["name"] = element.name;
                                }
                            })
                            if (js["data"]["coin"] == "WAVES") {
                                js["data"]["name"] = "WAVES";
                            }

                            console.log(js);
                            dict.push({
                                key: element.key,
                                value: js['data']
                            });
                        }
                    });

                    main.push(dict);
                    main.push(config1.accepted);

                    console.log(main);
                    resolve((main));
                } catch (error) {
                    console.log(error.response.status);
                    if (error.response.status == 404) {
                        setTimeout(function () {
                            getData(url);
                        }, 5000);
                    }
                }
            };
            getData(url);
        } catch (error) {
            console.log(error);
        }
    })
}


async function checkKeeperTrx(TID) {
    return new Promise(function (resolve, reject) {
        try {
            dict = [];
            console.log(TID);
            const url = config1.address.node + "/transactions/info/" + TID;
            console.log(url);

            const getData = async url => {
                try {
                    const response = await axios.get(url);
                    const data = response.data;
                    console.log(data);
                    dict.push({
                        key: (data['id']).toString(),
                        value: "PAYMENT SUCCESSFUL"
                    });
                    resolve(dict);
                } catch (error) {
                    console.log(error.response.status);
                    if (error.response.status == 404) {
                        setTimeout(function () {
                            getData(url);
                        }, 5000);
                    }
                }
            };
            getData(url);
        } catch (error) {
            console.log(error);
        }
    })
}

 async function checkBlockchain(DATA, TRYAGAIN) {
    return new Promise(function (resolve, reject) {
        try {
            dict = [];
            console.log(DATA);
            const url = config1.address.node + "/transactions/address/" + config1.address.wallet + "/limit/100";
            console.log(url);
            const getData = async url => {
                try {
                    const response = await axios.get(url);
                    const data = response.data;

                    var search = "";
                    if (data[0].length <= 0) {
                        setTimeout(function () {
                            getData(url, 0);
                        }, 5000);
                    } else {
                        data[0].forEach(function (element) {
                            if (element['attachment'] != null) {
                                var A = Base58.decode(element['attachment'])
                                var B = String.fromCharCode.apply(null, A);
                                if (B == DATA) {
                                    console.log("PAYMENT SUCCESSFUL");
                                    dict.push({
                                        key: (element['id']).toString(),
                                        value: "PAYMENT SUCCESSFUL"
                                    });
                                    resolve(dict);
                                    search = B;
                                }
                            }

                        });
                        console.log("try again..", DATA, TRYAGAIN);

                        if (TRYAGAIN < 20) {
                            if (search != DATA) {
                                TRYAGAIN++;

                                setTimeout(function () {
                                    getData(url, TRYAGAIN);
                                }, 5000);
                            }
                        }else{
                            dict.push({
                                key: "PAYMENT FAILURE",
                                value: "PAYMENT FAILED"
                            });
                            resolve(dict);
                        }
                    }
                } catch (error) {
                    console.log(error);
                    if (error.response.status == 404) {
                        setTimeout(function () {
                            getData(url);
                        }, 5000);
                    }
                }
            };
            getData(url);
        } catch (error) {
            console.log(error);
        }
    })
}




