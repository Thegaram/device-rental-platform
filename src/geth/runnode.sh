#!/bin/bash

geth --datadir ./datadir --port "30303" --rpcport "8545" --rpc --rpccorsdomain "*" --rpcapi "db,eth,net,web3,personal" --identity "MyNodeName" --networkid 1999 --nodiscover --maxpeers 0 --ws --wsport "8546" --wsorigins="*" --mine --password ./password --unlock "0xdfb0eb1fb0ba4d21f853a263f38edcb0aebd6c22"
