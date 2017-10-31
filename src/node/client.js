const fs = require("fs");
const assert = require('assert');
const winston = require('winston');
const minimist = require('minimist');

const Contract = require('./utils/contract.js');
const SSHClient = require('./utils/ssh_client.js');
const RESTClient = require('./utils/rest_client');
const RPCClient = require('./utils/rpc_client');
const DH = require('./utils/dh.js');
const Utils = require('./utils/utils.js');


var argv = require('minimist')(process.argv.slice(2), {
  string: ['privkey', 'ethNodeUrl', 'descriptorPath'],
  boolean: ['debug'],
  default: {
    ethNodeUrl: 'ws://localhost:8546',
    debug: false,
    confreq: 12,
    gas: 1000000,
    accessTimeSeconds: 10
  }
});

if (!argv.privkey) {
  winston.error('ethereum address not set! please use the --privkey option!');
  process.exit(1);
}

if (!argv.descriptorPath) {
  winston.error('device descriptor path not set! please use the --descriptorPath option!');
  process.exit(1);
}

winston.level = argv.debug ? 'debug' : argv.verbose ? 'verbose' : 'info';

const contractAbi = require('../truffle/build/contracts/DeviceContract.json').abi;

const prime = 'd3b228bb6c57848417e32609347205a17db75b02c8a3248b2e09ea84f0749a0924e923310269d10461aba31e7183be58286ddd79861ee3eb1278e032c6defc5e466abe830500cc16fc629c60076b2e0e9dc38e2b4d3fb4e6d67d41c4546b4b0a006d86dc488a9444b8f3fb0e9538f0fc4e1817ccb55b951fa61bd3199beb9a2c850279e0916f625d851784a1c000ca6ebdc325806ad1ff48b3b95ffe49af65b227ff46f263d53d6d7d16cf610a830dbf14cab5de3db65c826b3004cb9bda5bf2f73bb9caa8d551635dbb2d8ff08b5674cb98d0e311017a35fb34c7652418fa16823b0424134bbe185e0c9da5c9aaef97d81cc7c9e0a76a5917f0f43e22afe7ab';

(async () => {
  // read device descriptor
  winston.info(`reading device descriptor from ${argv.descriptorPath}...`);
  const descriptorFileContent = fs.readFileSync(argv.descriptorPath);
  const descriptor = JSON.parse(descriptorFileContent);

  // initialize contract
  winston.info(`connecting to contract ${descriptor.contractAddress} through node ${argv.ethNodeUrl}...`);
  const contract = new Contract(argv.ethNodeUrl, contractAbi, descriptor.contractAddress, argv.privkey, argv.confreq);

  // retrieve price
  winston.info('verifying service price on contract...');
  const pricePerSecond = await contract.weiPerSecond();
  assert(pricePerSecond === descriptor.weiPerSecond, 'price in descriptor and contract do not match! terminating');
  const paymentValue = argv.accessTimeSeconds * pricePerSecond;
  winston.info(`price for ${argv.accessTimeSeconds} seconds of access: ${paymentValue} wei`);

  // retrieve server certificate
  winston.info('retrieving server certificate...');
  const certificate = await contract.certificate();

  // generate keys for key exchange
  winston.info('generating keys...');
  const dh = new DH(prime);
  const pubkey = dh.getPublicKey();

  // request access from contract
  winston.info('requesting access from contract...');
  const requestId = await contract.request(pubkey, paymentValue, argv.gas);
  winston.info(`request accepted! requestId = ${requestId}`);

  // wait for approval
  winston.info('waiting for approval...');
  const approval = await contract.waitForApproval();
  winston.debug(approval);

  // establish secret
  winston.info('establishing shared secret...');
  const secret = dh.computeSecret(approval.pubkey);
  winston.debug(secret);

  // perform access
  winston.info(`performing access through ${approval.data.accessMode}...`);
  await performAccess(approval, certificate, secret);
  winston.info('access terminated!');
})();

async function performAccess(approval, certificate, secret) {
  if (approval.data.accessMode === Utils.AccessMode.SSH) {
    await SSHClient.shell(approval.data, secret);
  }
  else if (approval.data.accessMode === Utils.AccessMode.REST) {
    const response = await RESTClient.request(approval.data, certificate, secret);
    winston.debug(response);
  }
  else if (approval.data.accessMode === Utils.AccessMode.GRPC) {
    const response = await RPCClient.request(approval.data, certificate, secret);
    winston.debug(response);
  }
  else {
    winston.error('unknown access mode!');
  }
}