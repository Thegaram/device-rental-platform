const grpc = require('grpc');
const fs = require('fs');

const service = grpc.load(__dirname + '/../service.proto').temperatureservice;
const cert = fs.readFileSync('sslcert/localhost.crt');

function request(url, requestId, secret) {
  const client = new service.TemperatureService(url,
    grpc.credentials.createSsl(cert));

  const metadata = new grpc.Metadata();
  metadata.add('username', requestId.toString());
  metadata.add('password', secret);
  
  return new Promise((resolve, reject) => {
    client.retrieveTemperature({}, metadata, function(err, response) {
      if (err)
        return reject(err);

      resolve(response.value);
    });
  });
}

module.exports = {
  request
};
