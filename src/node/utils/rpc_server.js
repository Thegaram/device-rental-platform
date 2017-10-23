const fs = require('fs');
const grpc = require('grpc');

const Utils = require('./utils.js');

const service = grpc.load(__dirname + '/../service.proto').temperatureservice;

const approved_requests = {};

function retrieveTemperature(call, callback) {
  const username = call.metadata.get('username')[0];
  const password = call.metadata.get('password')[0];
  const secret = approved_requests[username];

  if (Utils.timingSafeEqual(password, secret))
    callback(null, {value: 15});
  else
    callback('unauthorized');
}

function getServer() {
  const server = new grpc.Server();
  server.addService(service.TemperatureService.service, {
    retrieveTemperature
  });
  return server;
}

const creds = grpc.ServerCredentials.createSsl(
  null,
  [{
    private_key: fs.readFileSync('sslcert/localhost.key'),
    cert_chain: fs.readFileSync('sslcert/localhost.crt')
  }],
  true
);

class RPC {
  constructor(port) {
    this.routeServer = getServer();
    this.routeServer.bind(`0.0.0.0:${port}`, creds);
    this.routeServer.start();
  }

  start_access(requestId, password) {
    approved_requests[requestId] = password;
  }

  stop_access(requestId) {
    delete approved_requests[requestId];
  }
}

module.exports = RPC;
