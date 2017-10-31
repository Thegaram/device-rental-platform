const crypto = require('crypto');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timingSafeEqual(a, b, maxlength) {
  if (typeof a !== 'string' && !(a instanceof String))
    return false;

  if (typeof b !== 'string' && !(b instanceof String))
    return false;

  maxlength = maxlength || 20;
  return crypto.timingSafeEqual(Buffer.from(a.padEnd(maxlength, '*')), Buffer.from(b.padEnd(maxlength, '*')));
}

function timeSecondsLater(numSeconds) {
  const t = new Date();
  t.setSeconds(t.getSeconds() + numSeconds);
  return t;
}

const AccessMode = {
  SSH: 'ssh',
  REST: 'https/rest',
  GRPC: 'https/grpc'
};

module.exports = {
  sleep,
  timingSafeEqual,
  timeSecondsLater,
  AccessMode
};
