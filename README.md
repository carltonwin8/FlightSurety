# Flight Insurance DAPP

The following Ethereum DAPP simulates buying flight insurance and making claims.

A user can:

- buy up to 1 ether of insurance for a fix number of flights,
- then the user can request the flight status information,
- a number of oracles generate randomized flight status information,
- if the flight is late, a user can claim 1.5 the insured amount.

The DAPP was completed for the
[Udacity Blockchain Term 2 FlightSurety Project](https://www.udacity.com/course/blockchain-developer-nanodegree--nd1309).

## Software Used

The following software needs to be installed.

- Nodejs and nvm by following the instructions
  [here](https://github.com/creationix/nvm).
- [Truffle](https://truffleframework.com/truffle)
  via `npm install truffle -g`.
- [Ganache CLI](https://truffleframework.com/ganache)
  via `npm install ganache-cli -g`.
- Metamask by following the instructions
  [here](https://metamask.io/).
  Setup Metamask with the `mnemonic` called out in the
  [Address Allocation](#Address-Allocation)
  section below.

The software version numbers used during test are noted below.

- Truffle v5.0.11 (core: 5.0.11)
- Solidity - ^0.4.25 (solc-js)
- Node v11.13.0
- Web3.js v1.0.0-beta.37
- Ganache CLI v6.4.2 (ganache-core: 2.5.4)
- MetaMask Version 6.3.2

## Testing Method

In order to test this application do the following:

- Start the block chain via `npm run gcli`.
- Start the server/oracles via `npm run server`.
- Deploy the contract to the block chain via `truffle deploy`.
- Start the client via `npm run dapp`.
- Open a web browser to http://localhost:8000

Verify the FlightSurety operations on the browser by doing the following:

- click
- etc

## Address Allocation

During testing the mnemonic
"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
was used to gererate the sequential addresses whoes indexes are noted below.
The allocation of the address follows.

| Address | Usage                        |
| ------- | ---------------------------- |
| 0       | Used to deploy the contracts |
| 1       | First Airline                |
| 2-7     | Airlines                     |
| 8,9     | Users                        |
| 10-30   | Oracles                      |

## Notes - Ignore

Everything below this line can be ignored as they are just notes to myself.

Read the student hub up to 4/12/19.
