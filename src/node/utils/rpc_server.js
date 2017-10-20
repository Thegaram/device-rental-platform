const fs = require('fs');
const grpc = require('grpc');

const service = grpc.load(__dirname + '/../service.proto').temperatureservice;

const approved_requests = {};

function retrieveTemperature(call, callback) {
  const username = call.metadata.get('username')[0];
  const password = call.metadata.get('password')[0];
  const secret = approved_requests[username];

  if (secret == password)
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

class RPC {
  constructor(port) {
    this.routeServer = getServer();
    this.routeServer.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
    // TODO: use SSL
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
