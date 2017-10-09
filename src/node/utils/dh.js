const crypto = require('crypto');

class DH {
  constructor(prime) {
    this.dh = crypto.createDiffieHellman(prime, 'hex');
    this.dh.generateKeys();
  }

  computeSecret(pubkey) {
    return this.dh.computeSecret(pubkey, 'hex', 'hex').substring(0, 32);
  }

  getPrime() {
    return this.dh.getPrime('hex');
  }

  getGenerator() {
    return this.dh.getGenerator('hex');
  }

  getPublicKey() {
    return this.dh.getPublicKey('hex');
  }
}

module.exports = DH;
