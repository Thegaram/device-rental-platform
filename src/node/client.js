const winston = require('winston');
const WS = require('ws');
const minimist = require('minimist');

const Contract = require('./utils/contract.js');
const ssh = require('./utils/ssh.js');
const WSP = require('./utils/ws.js');
const DH = require('./utils/dh.js');
const Utils = require('./utils/utils.js');


var argv = require('minimist')(process.argv.slice(2), {
  string: ['ethaddr', 'contractaddr', 'ethNodeUrl', 'wsUrl'],
  boolean: ['debug'],
  default: {
    ethNodeUrl: 'http://localhost:8545',
    wsUrl: 'ws://localhost:3333',
    debug: false,
    confreq: 12,
    gas: 1000000,
    accessTimeSeconds: 10
  }
});

if (!argv.ethaddr) {
  console.error('ethereum address not set! please use the --ethaddr option!');
  process.exit(1);
}

if (!argv.contractaddr) {
  console.error('contract address not set! please use the --contractaddr option!');
  process.exit(1);
}

winston.level = argv.debug ? 'debug' : argv.verbose ? 'verbose' : 'info';


const contractAbi = require('../truffle/build/contracts/DeviceContract.json').abi;
const contract = new Contract(argv.ethNodeUrl, contractAbi, argv.contractaddr, argv.ethaddr, argv.confreq);


(async () => {
  const pricePerSecond = await contract.weiPerSecond();
  const paymentValue = argv.accessTimeSeconds * pricePerSecond;

  // request access from contract
  winston.info('requesting access from contract...');
  let requestId = await contract.request(paymentValue, argv.gas);
  winston.info(`access granted! requestId = ${requestId}`);


  // connect to device through websocket
  winston.info('connecting to device...');
  const ws = new WS(argv.wsUrl);
  const wsp = new WSP(ws);
  await wsp.open();
  winston.info('connected to device!');


  // request access from device and perform key exchange
  winston.info('requesting access from device...')
  const reply = await wsp.request({ requestId: requestId });

  winston.info('performing key exchange...')
  const dh = new DH(reply.prime, reply.generator);
  const secret = dh.computeSecret(reply.pubkey);
  winston.info('established shared secret!');
  winston.debug(secret);

  const approval = await wsp.request({
    pubkey: dh.getPublicKey()
  });

  if (approval.status != 'APPROVED') {
    // TODO
  }

  winston.info('access granted!');


  // close websocket connection
  winston.info('closing ws connection...');
  await wsp.close();
  winston.info('ws connection closed!');


  // connect through ssh
  winston.info('starting ssh session...');
  await ssh.shell({
    host: approval.host,
    port: approval.port,
    username: approval.username,
    password: secret,
    // askPassword: true,
    // debug: console.log,
  });
  winston.info('ssh connection closed!');
})();
