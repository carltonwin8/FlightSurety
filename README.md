# Flight Insurance DAPP

The following Ethereum DAPP simulates buying flight insurance and making claims.

A user can:

- buy up to 1 ether of insurance for a fix number of flights,
- then the user can request the flight status information,
- a number of oracles generates randomized flight status information,
- if the flight is late, a user can claim 1.5x the insured amount.

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

The software version numbers used during testing are noted below.

- Truffle v5.0.11 (core: 5.0.11)
- Solidity - ^0.4.25 (solc-js)
- Node v11.13.0
- Web3.js v1.0.0-beta.37
- Ganache CLI v6.4.2 (ganache-core: 2.5.4)
- MetaMask Version 6.3.2

## Testing Method

Test suits can be run buy:

- start the block chain via `npm run gcli`
- test the airline, flight and passanger functionality by `npm run test`
- test the oracle functionality by `npm run testo`

In order to test this application via the web GUI do the following:

- Start the block chain via `npm run gcli`.
- Deploy the contract to the block chain via `truffle deploy`.
- Start the server/oracles via `npm run server`.
- Start the client via `npm run dapp`.
- Open a web browser to http://localhost:8000

Verify the FlightSurety operations in the browser by doing the following:

- click `Fund Airline`
- click `Register Airline`
- click `Register Flight`
- click `Buy Insurance`
- click `Flight Status`
- click `View Credit`
- click `Claim Insurance`

After clicking the buttons above a status is shown that can be cleared.
The balance for the two contracts and users are shown and are updated
realtime for transactions that require funding.

## Address Allocation

During testing the mnemonic
"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
was used to gererate the sequential addresses whose indexes are noted below.
The allocation of the address follows and are in `./src/server/addressInfo.js`.

| Address | Usage                        |
| ------- | ---------------------------- |
| 0       | Used to deploy the contracts |
| 1       | First Airline                |
| 2-7     | Airlines                     |
| 8-9     | Passangers                   |
| 10-30   | Oracles                      |

## Notes - Ignore

Everything below this line can be ignored as they are just notes to myself.

Read the student hub up to 4/22/19.

Recommended Gas And Price

"gas": 4712388,
"gasPrice": 100000000000

## Functions And Modifiers

Key for the tables below follows

- I/E - i = internal, e = external, ip = internal pure
- UB - used by
  - app contract
  - data contract
- SF - Short Form - Abbreviation - for modifiers
- MR - Modifiers required - use from SF in table - 0/- = none

### FlightSuretyData.sol

| Modifiers              | SF  | ToDo |
| ---------------------- | --- | ---- |
| requireIsOperational   | io  | -    |
| requireContractOwner   | co  | -    |
| isCallerAuthorized     | ca  | -    |
| requireAirlineFunded   | af  | -    |
| requirePassangerFunded | pf  | -    |

| Functions          | I/E | MR         |
| ------------------ | --- | ---------- |
| isOperational      | e   | -          |
| isAuthorized       | e   | -          |
| setOperatingStatus | e   | co         |
| getFlightKey       | ip  | -          |
| getPassangerKey    | ip  | -          |
| authorizeCaller    | e   | co         |
| deauthorizeCaller  | e   | co         |
| fund               | e   | io, ca     |
| registerAirline    | e   | io, ca, af |
| registerFlight     | e   | io ca, af  |
| buy                | e   | io, ca, fr |
| creditInsurees     | e   | io, ca, fr |
| clearInsurees      | e   | io, ca, fr |
| passangerCredit    | e   | -          |
| pay                | e   | io, ca, pf |

### FlightSuretyApp.sol

| Modifiers            | SF  |
| -------------------- | --- |
| requireIsOperational | io  |
| requireContractOwner | co  |

CB - called by

- cg = client web gui
- s = server
- ct = client test in flightSurity.js
- st = server test in oracles.js
- nn/- = no one - internal

| Functions            | I/E | MR  | CB     | ToDo |
| -------------------- | --- | --- | ------ | ---- |
| isOperational        | e   | -   | cg, ct | -    |
| registerAirline      | e   | co  | cg, ct | -    |
| fundAirline          | e   | -   | cg, ct | -    |
| registerFlight       | e   | -   | cg,    | ct   |
| buy                  | e   | -   | cg     | ct   |
| processFlightStatus  | i   | -   | -      | -    |
| fetchFlightStatus    | e   | -   | cg, ct | -    |
| claimInsurance       | e   | -   | cg     | ct   |
| passangerCredit      | e   | -   | cg     | ct   |
| getNoOracles         | e   | -   | ct, s  | -    |
| registerOracle       | e   | -   | ct, s  | -    |
| getMyIndexes         | e   | -   | ct, s  | -    |
| submitOracleResponse | e   | -   | ct, s  | -    |
| generateIndexes      | i   | -   | -      | -    |
| getRandomIndex       | i   | -   | -      | -    |
