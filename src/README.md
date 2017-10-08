# How to set up

1. **install dependencies**
```
src/node $ npm install -g ethereumjs-testrpc truffle
src/node $ npm install
```

2. **install Docker and build container**
```
src/docker $ docker build -t eg_sshd .
```

3. **start testrpc**
```
src $ testrpc -b 1 -d
```

(`-b 1` means we enable automatic mining every second, `-d` means we want to get the same addresses and keys every time we run this command.)

Note down the available accounts you would like to use and their private keys.

4. **compile and deploy contracts**
```
src/truffle $ truffle deploy
```

Note down the address of the contract `DeviceContract`.

5. **run device program, providing the `ethaddr` and `contractaddr` options**
```
src/node $ node device.js --contractaddr=0xc89ce4735882c9f0f0fe26686c53074e09b0d550 --privkey="6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1" --confreq=4 --debug
```

(For a full list of command line options, please refer to the source code. The addresses above are just examples, the ones you use should be taken from `testrpc`'s output.)

6. **run client program**
```
src/node $ node client.js --contractaddr="0xc89ce4735882c9f0f0fe26686c53074e09b0d550" --privkey="4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d" --confreq=4 --debug --accessTimeSeconds=5
```

(For a full list of command line options, please refer to the source code. The addresses above are just examples, the ones you use should be taken from `testrpc`'s output.)

# Example output

<p align="center">
    <img src="./diagrams/imgs/prototype_output.png">
</p>

# Control flow

<p align="center">
    <img src="./diagrams/imgs/prototype.png" width="500">
</p>
