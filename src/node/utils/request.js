const https = require('https');

const regex = /^(https?):\/\/([a-zA-Z0-9._]+)(?::(\d+))?(\/[a-zA-Z0-9._\/]+)?$/;

function performRequest(url, requestId, secret) {
  const matches = regex.exec(url);

  const options = {
    protocol: 'https:',
    host: matches[2],
    port: matches[3] || 443,
    path: matches[4],
    rejectUnauthorized: false, // TODO
    auth: `${requestId}:${secret}`
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
  perform: performRequest
};
