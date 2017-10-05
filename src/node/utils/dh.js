const crypto = require('crypto');

class DH {
  constructor(a, b) {
    // a: primeSize    OR
    // a: prime, b: generator

    if (b === undefined)
      this.dh = crypto.createDiffieHellman(a);
    else
      this.dh = crypto.createDiffieHellman(a, 'hex', b, 'hex');
    
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
