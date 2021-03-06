# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Resources

- [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
- [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
- [Truffle Framework](http://truffleframework.com/)
- [Ganache Local Blockchain](http://truffleframework.com/ganache/)
- [Remix Solidity IDE](https://remix.ethereum.org/)
- [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
- [Ethereum Blockchain Explorer](https://etherscan.io/)
- [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)

## Notes

Please ignore the text below here as it is just used as a scratch pad.

### Notes To Self

Start `ganache-cli` with `--noVMErrorsOnRPCResponse` option to work with

`truffle`.
This option makes the `ganache-cli` behave like the two main ethereum
clients `geth` and `parity`.
I am assuming that `truffle`, maybe via `web`, expects this behaviour and
when the `ganache-cli` option it **NOT** provided `truffle` and the
`ganache-cli` get out of sync and nonce issues are seen.

Read the udacity student hub up to and including April 5, 2019.

Questions providing repositories on date noted.

- https://gitlab.com/urkopineda/bcnd-flightsurety - March 22
- https://github.com/dmavridis/blockchain-FlightSurety - April 7
