const fs = require('fs');
const https = require('https');
const express = require('express');
const basicAuth = require('express-basic-auth');

const credentials = {
  key : fs.readFileSync('sslcert/server.key', 'utf8'),
  cert: fs.readFileSync('sslcert/server.crt', 'utf8')
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const temperatureReading = {
  data: 19,
  time: new Date()
};

setInterval(() => {
  temperatureReading.data = getRandomInt(15, 25);
  temperatureReading.time = new Date();
}, 10000);
 
function createAsyncAuthorizer(approved_requests) {
  return function(username, password, cb) {
    const requestId = username;
    const secret = approved_requests[requestId];

    return cb(null, secret === password);
  };
}

const app = express();

app.disable('x-powered-by');

app.get('/heartbeat', function (req, res) {
  res.send('ping');
});

const approved_requests = {
  // EMPTY
};

app.use('/temperature', basicAuth({
  authorizer: createAsyncAuthorizer(approved_requests),
  authorizeAsync: true,
  challenge: true
}));

app.get('/temperature', function (req, res) {
  const result = {
    requestor: req.auth.user,
    data: temperatureReading.data,
    requestTime: new Date().toISOString(),
    readingTime: temperatureReading.time.toISOString(),
    format: 'Celsius'
  };

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(result));
});

class Server {
  constructor(http_port) {
    this.httpsServer = https.createServer(credentials, app);
    this.httpsServer.listen(http_port);
  }

  start_access(requestId, password) {
    approved_requests[requestId] = password;
  }

  stop_access(requestId) {
    delete approved_requests[requestId];
  }
}

module.exports = Server;
