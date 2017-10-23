const grpc = require('grpc');

const service = grpc.load(__dirname + '/../service.proto').temperatureservice;

function request(url, certificate, requestId, secret) {
  const client = new service.TemperatureService(url,
    grpc.credentials.createSsl(Buffer.from(certificate, 'utf8')));

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
