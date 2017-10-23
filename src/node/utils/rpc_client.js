const grpc = require('grpc');

const service = grpc.load(__dirname + '/../service.proto').temperatureservice;

function request(data, certificate, password) {
  const url = data.url;
  const username = data.username;

  const client = new service.TemperatureService(url,
    grpc.credentials.createSsl(Buffer.from(certificate, 'utf8')));

  const metadata = new grpc.Metadata();
  metadata.add('username', username);
  metadata.add('password', password);
  
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
