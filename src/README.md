# How to set up

1. **set up your local ethereum node**

```
blockchain_iot/src/geth $ geth version
Geth
Version: 1.7.0-stable
...

blockchain_iot/src/geth $ ./init.sh 
...

blockchain_iot/src/geth $ ./runnode.sh 
...
```

`init.sh` initializes a new local blockchain in the `datadir` directory and initializes the following three accounts with 100000 ether each:

- coinbase:
    + pubkey: 0xdfb0eb1fb0ba4d21f853a263f38edcb0aebd6c22
    + privkey: e52ab8dfeebeea62cf26e296ddc658c0805fe365297da0053e6260e3ca435bd6

- device:
    + pubkey: 0x725e67c6eb9e8deff544525cb1be48a920b652b3
    + privkey: 4aae80eb87a8e986c3825e323c186c67742852b7ce42fbd17494f1aab62c4ba5

- client:
    + pubkey: 0x2529536b8ca732e54b3f157fbe7c52ab35f4c708
    + privkey: 0649f1ba06eb15d5f293e8943a6cd3be6396ca981ea87412faa3e8cc8338dbc5

(Warning: in real-world circumstances you should never disclose your private key.)

`runnode.sh` runs a node with RPC endpoint on `http://localhost:8545` and WS endpoint on `ws://localhost:8546`. (Note: in order to use events, we need to connect to the WS endpoint.)

`runnode.sh` also unlocks the coinbase account so that we can later deploy our contracts, and starts mining.

If you want to connect directly to your node, run `attach.sh`:

```
blockchain_iot/src/geth $ ./attach.sh 
Welcome to the Geth JavaScript console!
...

> eth.accounts
["0xdfb0eb1fb0ba4d21f853a263f38edcb0aebd6c22", "0x725e67c6eb9e8deff544525cb1be48a920b652b3", "0x2529536b8ca732e54b3f157fbe7c52ab35f4c708"]
> eth.getBalance(eth.accounts[1])
1e+23
...
```

2. **compile and deploy contracts**
```
blockchain_iot/src/truffle $ npm install -g truffle
blockchain_iot/src/truffle $ truffle deploy
Using network 'development'.

...
  Replacing DeviceContract...
  ... 0xf71fbdcbe5d5555edb036efb2c94eafd203ee8fe44b911e0c9500e4bbc5a5fa8
  DeviceContract: 0xb1df3bd91ab7ff0426943e46bdc9ef52c150b69e
...
Saving artifacts...
```

Note down the contract address (`0xb1df3bd91ab7ff0426943e46bdc9ef52c150b69e` in this example).

3. **install Docker and build container**
```
blockchain_iot/src/docker $ docker build -t eg_sshd .
```

4. **run device program**
```
blockchain_iot/src/node $ npm install
blockchain_iot/src/node $ node device.js --contractaddr="<<contract address>>" --privkey="4aae80eb87a8e986c3825e323c186c67742852b7ce42fbd17494f1aab62c4ba5" --confreq=4 --debug
```

Replace the placeholder `<<contract address>>` with the address you just noted down.

5. **run client program**
```
blockchain_iot/src/node $ node client.js --contractaddr="<<contract address>>" --privkey="0649f1ba06eb15d5f293e8943a6cd3be6396ca981ea87412faa3e8cc8338dbc5" --confreq=4 --debug --accessTimeSeconds=5
```

Replace the placeholder `<<contract address>>` with the address you just noted down.
