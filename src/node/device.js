const winston = require('winston');
const fs = require('fs');

const Contract = require('./utils/contract.js');
const DH = require('./utils/dh.js');
const SSHServer = require('./utils/ssh_server.js');
const RESTServer = require('./utils/rest_server.js');
const RPCServer = require('./utils/rpc_server.js');
const Utils = require('./utils/utils.js');


var argv = require('minimist')(process.argv.slice(2), {
  string: ['privkey', 'contractaddr', 'ethNodeUrl'],
  boolean: ['debug'],
  default: {
    ethNodeUrl: 'ws://localhost:8546',
    debug: false,
    confreq: 12,
    gas: 1000000
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

const container_name = 'eg_sshd';
const serverPort = '8000';

const contractAbi = require('../truffle/build/contracts/DeviceContract.json').abi;
const contract = new Contract(argv.ethNodeUrl, contractAbi, argv.contractaddr, argv.privkey, argv.confreq);

const prime = 'd3b228bb6c57848417e32609347205a17db75b02c8a3248b2e09ea84f0749a0924e923310269d10461aba31e7183be58286ddd79861ee3eb1278e032c6defc5e466abe830500cc16fc629c60076b2e0e9dc38e2b4d3fb4e6d67d41c4546b4b0a006d86dc488a9444b8f3fb0e9538f0fc4e1817ccb55b951fa61bd3199beb9a2c850279e0916f625d851784a1c000ca6ebdc325806ad1ff48b3b95ffe49af65b227ff46f263d53d6d7d16cf610a830dbf14cab5de3db65c826b3004cb9bda5bf2f73bb9caa8d551635dbb2d8ff08b5674cb98d0e311017a35fb34c7652418fa16823b0424134bbe185e0c9da5c9aaef97d81cc7c9e0a76a5917f0f43e22afe7ab';

// generate keys for key exchange
winston.info('generating keys...');
const dh = new DH(prime);
const pubkey = dh.getPublicKey();
winston.info('keys generated successfully!');

async function checkCertificate() {
  const localCert = fs.readFileSync('sslcert/localhost.crt', 'utf8');
  const contractCert = await contract.certificate();

  if (localCert !== contractCert) {
    winston.info('uploading certificate...');
    await contract.setCertificate(localCert, 100000000);
    winston.info('certificate uploaded successfully!');
  }
}

// const service = new SSHServer(container_name, serverPort);
// const service = new RESTServer(serverPort);
const service = new RPCServer(serverPort);

(async function requestLoop() {
  winston.info('checking certificate...');
  await checkCertificate();

  while (true) {
    // receive initial request with requestId and pubKey
    console.log();
    winston.info('waiting for request...');
    const request = await contract.waitForNewRequest();
    winston.info(`new request: ${request.requestId}!`);

    await handleRequest(request);
  }
})();

async function handleRequest(request) {
  // establish secret
  const secret = dh.computeSecret(request.pubkey);
  winston.info('established shared secret!');
  winston.debug(secret);

  // start access on service
  winston.info('starting access on service...');
  await service.start_access(request.requestId, secret);
  winston.info('access started on service!');

  // start access on contract
  winston.info(`starting access on contract for ${request.requestId}...`);
  const keepAliveSeconds = await contract.getAllowedExecutionTimeSeconds(request.requestId);

  const data = {
    username: request.requestId.toString(),
    accessEndTime: Utils.timeSecondsLater(keepAliveSeconds).toISOString()
  };

  // ssh
  // data.accessMode = 'SSH';
  // data.host = 'localhost';
  // data.port = serverPort;

  // rest
  // data.accessMode = 'HTTPS/REST';
  // data.url = `https://localhost:${serverPort}/temperature`

  // rpc
  data.accessMode = 'HTTPS/GRPC';
  data.url = `localhost:${serverPort}`;

  await contract.access_started(request.requestId, pubkey, JSON.stringify(data), argv.gas);
  winston.info('access started on contract!');

  // wait and then stop access
  winston.info(`allowing access for ${keepAliveSeconds} seconds...`);
  await Utils.sleep(keepAliveSeconds * 1000);
  winston.info('stopping access on service...');
  await service.stop_access(request.requestId);
  winston.info('access stopped on service!');

  // finish access on contract
  winston.info('finishing access on contract...');
  await contract.access_finished(request.requestId, argv.gas);
  winston.info('access finished on contract!');
};
