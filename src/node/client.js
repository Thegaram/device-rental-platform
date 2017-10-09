const winston = require('winston');
const minimist = require('minimist');

const Contract = require('./utils/contract.js');
const ssh = require('./utils/ssh.js');
const DH = require('./utils/dh.js');
const Utils = require('./utils/utils.js');


var argv = require('minimist')(process.argv.slice(2), {
  string: ['privkey', 'contractaddr', 'ethNodeUrl'],
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
  console.error('ethereum address not set! please use the --privkey option!');
  process.exit(1);
}

if (!argv.contractaddr) {
  console.error('contract address not set! please use the --contractaddr option!');
  process.exit(1);
}

winston.level = argv.debug ? 'debug' : argv.verbose ? 'verbose' : 'info';

const contractAbi = require('../truffle/build/contracts/DeviceContract.json').abi;
const contract = new Contract(argv.ethNodeUrl, contractAbi, argv.contractaddr, argv.privkey, argv.confreq);

const prime = 'd3b228bb6c57848417e32609347205a17db75b02c8a3248b2e09ea84f0749a0924e923310269d10461aba31e7183be58286ddd79861ee3eb1278e032c6defc5e466abe830500cc16fc629c60076b2e0e9dc38e2b4d3fb4e6d67d41c4546b4b0a006d86dc488a9444b8f3fb0e9538f0fc4e1817ccb55b951fa61bd3199beb9a2c850279e0916f625d851784a1c000ca6ebdc325806ad1ff48b3b95ffe49af65b227ff46f263d53d6d7d16cf610a830dbf14cab5de3db65c826b3004cb9bda5bf2f73bb9caa8d551635dbb2d8ff08b5674cb98d0e311017a35fb34c7652418fa16823b0424134bbe185e0c9da5c9aaef97d81cc7c9e0a76a5917f0f43e22afe7ab';

(async () => {
  const pricePerSecond = await contract.weiPerSecond();
  const paymentValue = argv.accessTimeSeconds * pricePerSecond;

  // generate keys for key exchange
  winston.info('generating keys...');
  const dh = new DH(prime);
  const pubkey = dh.getPublicKey();
  winston.info('keys generated successfully!');

  // request access from contract
  winston.info('requesting access from contract...');
  const requestId = await contract.request(pubkey, paymentValue, argv.gas);
  winston.info(`access granted! requestId = ${requestId}`);

  // wait for approval
  const approval = await contract.waitForApproval();
  winston.info('access granted!');

  // establish secret
  const secret = dh.computeSecret(approval.pubkey);
  winston.info('established shared secret!');
  winston.debug(secret);

  // connect through ssh
  winston.info('starting ssh session...');
  await ssh.shell({
    host: approval.data.host,
    port: approval.data.port,
    username: approval.data.username,
    password: secret,
    // askPassword: true,
    // debug: console.log,
  });
  winston.info('ssh connection closed!');
})();
