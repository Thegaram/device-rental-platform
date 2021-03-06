const https = require('https');

const regex = /^(https?):\/\/([a-zA-Z0-9._]+)(?::(\d+))?(\/[a-zA-Z0-9._\/]+)?$/;

function request(data, certificate, password) {
  const url = data.url;
  const username = data.username;

  const matches = regex.exec(url);

  const options = {
    protocol: 'https:',
    host: matches[2],
    port: matches[3] || 443,
    path: matches[4],
    auth: `${username}:${password}`,
    ca: certificate
  };

  return new Promise((resolve, reject) => {
    const req = https.get(options, function(res) {
      const bodyChunks = [];
      res.on('data', function(chunk) {
        bodyChunks.push(chunk);
      }).on('end', function() {
        const body = Buffer.concat(bodyChunks);
        const response = JSON.parse(body);
        resolve(response);
      })
    });

    req.on('error', function(e) {
      reject(e);
    });
  });
}

module.exports = {
  request
};
