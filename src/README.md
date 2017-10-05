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
src $ testrpc -b 1
```

(`-b 1` means we enable automatic mining every second.)

Note down the available accounts you would like to use.

4. **compile and deploy contracts**
```
src/truffle $ truffle deploy
```

Note down the address of the contract `DeviceContract`.

5. **run device program, providing the `ethaddr` and `contractaddr` options**
```
src/node $ node device.js --ethaddr=0xd439371cd35ab4dc748fae49ba5caa8d0c0725b5 --contractaddr=0x8612110fcb0496729604111ef8b0c7354dafac48 --confreq=4 --debug
```

(For a full list of command line options, please refer to the source code. The addresses above are just examples, the ones you use should be taken from `testrpc`'s output.)

6. **run client program**
```
src/node $ node client.js --ethaddr="0x41d3249ba7777740589f9183c53017a01b7ebe21" --contractaddr="0x8612110fcb0496729604111ef8b0c7354dafac48" --confreq=4 --debug
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
