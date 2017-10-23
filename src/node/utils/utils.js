const crypto = require('crypto');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timingSafeEqual(a, b, maxlength) {
  maxlength = maxlength || 20;
  return crypto.timingSafeEqual(Buffer.from(a.padEnd(maxlength, '*')), Buffer.from(b.padEnd(maxlength, '*')));
}

module.exports = {
  sleep,
  timingSafeEqual
};
