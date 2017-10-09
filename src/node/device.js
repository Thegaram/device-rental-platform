const winston = require('winston');
const WS = require('ws');

const Contract = require('./utils/contract.js');
const DH = require('./utils/dh.js');
const WSP = require('./utils/ws.js');
const SSHContainer = require('./utils/docker.js').SSHContainer;
const Utils = require('./utils/utils.js');


var argv = require('minimist')(process.argv.slice(2), {
  string: ['privkey', 'contractaddr', 'ethNodeUrl', 'wsport'],
  boolean: ['debug'],
  default: {
    ethNodeUrl: 'http://localhost:8545',
    wsport: 3333,
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
const ssh_port = '4000';

const contractAbi = require('../truffle/build/contracts/DeviceContract.json').abi;
const contract = new Contract(argv.ethNodeUrl, contractAbi, argv.contractaddr, argv.privkey, argv.confreq);

const prime = 'd3b228bb6c57848417e32609347205a17db75b02c8a3248b2e09ea84f0749a0924e923310269d10461aba31e7183be58286ddd79861ee3eb1278e032c6defc5e466abe830500cc16fc629c60076b2e0e9dc38e2b4d3fb4e6d67d41c4546b4b0a006d86dc488a9444b8f3fb0e9538f0fc4e1817ccb55b951fa61bd3199beb9a2c850279e0916f625d851784a1c000ca6ebdc325806ad1ff48b3b95ffe49af65b227ff46f263d53d6d7d16cf610a830dbf14cab5de3db65c826b3004cb9bda5bf2f73bb9caa8d551635dbb2d8ff08b5674cb98d0e311017a35fb34c7652418fa16823b0424134bbe185e0c9da5c9aaef97d81cc7c9e0a76a5917f0f43e22afe7ab';

(() => {
  // generate keys for key exchange
  winston.info('generating keys...');
  const dh = new DH(prime);
  winston.info('keys generated successfully!');

  // start websocket server
  const wss = new WS.Server({ port: argv.wsport });
  winston.info('listening for websocket connections on port ' + argv.wsport);

  wss.on('connection', async (ws) => {
    winston.info('websocket connection established!');
    const wsp = new WSP(ws);

    // receive initial request with requestId and pubKey
    winston.info('waiting for request...');
    const request = await wsp.receive();
    winston.info(`new request: ${request.requestId}!`);


    // start access on contract
    winston.info(`starting access on contract for ${request.requestId}...`);
    await contract.access_started(request.requestId, argv.gas);
    winston.info('access started on contract!');


    // establish secret
    const secret = dh.computeSecret(request.pubkey);
    winston.info('established shared secret!');
    winston.debug(secret);


    // start container
    winston.info('starting container...');
    const container = new SSHContainer(container_name, ssh_port, secret);
    await container.start();
    winston.info('container started!');

    wsp.send({
      status: 'APPROVED',
      host: 'localhost',
      port: ssh_port,
      username: 'root',
      pubkey: dh.getPublicKey()
    });

    wsp.close();


    // wait and then stop access
    const keepAliveSeconds = await contract.getAllowedExecutionTimeSeconds(request.requestId);
    winston.info(`allowing access for ${keepAliveSeconds} seconds...`);
    await Utils.sleep(keepAliveSeconds * 1000);
    winston.info('stopping container...');
    await container.stop();
    winston.info('container stopped!');


    // finish access on contract
    winston.info('finishing access on contract...');
    await contract.access_finished(request.requestId, argv.gas);
    winston.info('access finished on contract!');
  });
})();
