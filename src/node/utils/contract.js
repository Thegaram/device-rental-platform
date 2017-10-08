const Web3 = require('web3');

class Contract {
  constructor(nodeUrl, abi, address, from, nconfirmationsdef) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));

    this.contract = new this.web3.eth.Contract(abi, address, {
      from: from
    });

    this.nconfirmationsdef = nconfirmationsdef;
  }

  sendTransaction(name, args, value, gas, nconfirmations) {
    nconfirmations = nconfirmations || this.nconfirmationsdef;

    return new Promise((resolve, reject) => {
      this.contract.methods[name].apply(this, args)
        .send({
          // from: from,
          value: value,
          gas: gas
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          if (confirmationNumber == (nconfirmations - 1)) {
            // TODO: is there a better way?
            if (receipt.gasUsed == gas)
              return reject('transaction failed');
            
            // TODO: review this
            if (args.length === 0) {
              const requestId = receipt.events.NewRequest.returnValues['0'];
              resolve(requestId);
            }
            else {
              resolve();
            }
          }
        })
        .on('error', reject);
    });
  }

  request(value, gas, nconfirmations) {
    return this.sendTransaction('request', [], value, gas, nconfirmations);
  }

  access_started(requestId, gas, nconfirmations) {
    return this.sendTransaction('access_started', [requestId], undefined, gas, nconfirmations);
  }

  access_finished(requestId, gas, nconfirmations) {
    return this.sendTransaction('access_finished', [requestId], undefined, gas, nconfirmations);
  }

  getAllowedExecutionTimeSeconds(requestId) {
    return this.contract.methods.getAllowedExecutionTimeSeconds(requestId).call();
  }

  weiPerSecond() {
    return this.contract.methods.weiPerSecond().call();
  }
}

module.exports = Contract;
