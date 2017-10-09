#!/bin/bash

rm -rf datadir
mkdir datadir
geth --datadir ./datadir init genesis.json
cp -r keystore datadir/