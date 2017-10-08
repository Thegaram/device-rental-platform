const Web3 = require('web3');
const EthereumTx = require('ethereumjs-tx');
const abiDecoder = require('abi-decoder');

class Contract {
  constructor(nodeUrl, abi, contractAddress, senderPrivateKey, nconfirmationsdef) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
    this.contract = new this.web3.eth.Contract(abi, contractAddress);

    this.contractAddress = contractAddress;
    this.senderPrivateKey = Buffer.from(senderPrivateKey, 'hex');
    this.senderAddress = this.web3.eth.accounts.privateKeyToAccount('0x' + senderPrivateKey).address;
    this.nconfirmationsdef = nconfirmationsdef;

    abiDecoder.addABI(abi);
  }

  sendTransaction(rawTransaction, nconfirmations, gas) {
    nconfirmations = nconfirmations || this.nconfirmationsdef;

    return new Promise((resolve, reject) => {
      this.web3.eth.sendSignedTransaction(rawTransaction)
        .on('confirmation', (confirmationNumber, receipt) => {
          if (confirmationNumber == (nconfirmations - 1)) {
            // TODO: is there a better way?
            if (receipt.gasUsed == gas)
              return reject('transaction failed');

            // TODO: review this
            if (receipt.logs.length !== 0) {
              const decodedLogs = abiDecoder.decodeLogs(receipt.logs);
              const requestId = this.web3.utils.hexToNumber(decodedLogs[0].events[0].value.replace('0x', ''));
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

  async getRawTxData(methodName, args, value, gas) {
    const cnt = await this.web3.eth.getTransactionCount(this.senderAddress);
    const gasPrice = await this.web3.eth.getGasPrice();
    const callData = this.contract.methods[methodName].apply(this, args).encodeABI();

    const txdata = {};
    txdata.nonce = this.web3.utils.toHex(cnt);
    txdata.gasPrice = this.web3.utils.toHex(gasPrice);
    txdata.gasLimit = this.web3.utils.toHex(gas);
    txdata.to = this.contractAddress;
    txdata.value = this.web3.utils.toHex(value);
    txdata.data = callData;

    const tx = new EthereumTx(txdata);
    tx.sign(this.senderPrivateKey);
    const serializedTx = tx.serialize();
    const rawTransaction = '0x' + serializedTx.toString('hex');
    return rawTransaction;
  }

  async request(value, gas, nconfirmations) {
    const rawTransaction = await this.getRawTxData('request', [], value, gas);
    return await this.sendTransaction(rawTransaction, nconfirmations, gas);
  }

  async access_started(requestId, gas, nconfirmations) {
    const rawTransaction = await this.getRawTxData('access_started', [requestId], 0, gas);
    return await this.sendTransaction(rawTransaction, nconfirmations, gas);
  }

  async access_finished(requestId, gas, nconfirmations) {
    const rawTransaction = await this.getRawTxData('access_finished', [requestId], 0, gas);
    return await this.sendTransaction(rawTransaction, nconfirmations, gas);
  }

  getAllowedExecutionTimeSeconds(requestId) {
    return this.contract.methods.getAllowedExecutionTimeSeconds(requestId).call();
  }

  weiPerSecond() {
    return this.contract.methods.weiPerSecond().call();
  }
}

module.exports = Contract;
