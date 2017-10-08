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


(() => {
  // generate keys for key exchange
  winston.info('generating keys...');
  const dh = new DH(1024);
  winston.info('keys generated successfully!');


  // start websocket server
  const wss = new WS.Server({ port: argv.wsport });
  winston.info('listening for websocket connections on port ' + argv.wsport);


  wss.on('connection', async (ws) => {
    winston.info('websocket connection established!');
    const wsp = new WSP(ws);


    // receive initial request with request ID
    winston.info('waiting for request ID...');
    let req = await wsp.receive();
    const requestId = req.requestId;
    winston.info(`received request ID: ${requestId}!`);


    // start access on contract
    winston.info(`starting access on contract for ${requestId}...`);
    await contract.access_started(requestId, argv.gas);
    winston.info('access started on contract!');
    

    // perform key exchange
    winston.info('performing key exchange...');
    req = await wsp.request({
      prime: dh.getPrime(),
      generator: dh.getGenerator(),
      pubkey: dh.getPublicKey()
    });

    const secret = dh.computeSecret(req.pubkey);
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
      username: 'root'
    });

    wsp.close();


    // wait and then stop access
    const keepAliveSeconds = await contract.getAllowedExecutionTimeSeconds(requestId);
    winston.info(`allowing access for ${keepAliveSeconds} seconds...`);
    await Utils.sleep(keepAliveSeconds * 1000);
    winston.info('stopping container...');
    await container.stop();
    winston.info('container stopped!');


    // finish access on contract
    winston.info('finishing access on contract...');
    await contract.access_finished(requestId, argv.gas);
    winston.info('access finished on contract!');
  });
})();