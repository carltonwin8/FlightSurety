import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";
import AddressInfo from "./addressInfo";
import fs from "fs";

let accounts = [];
const oraclesInfo = [];
const oraclesInfoFile = "oraclesInfo.log";
let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);

let Passangers;
let Airlines;
let Flights;
let Oracles;

(async () => {
  try {
    let stopOnFSI = false;
    const gas = 2000000;
    accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = accounts[0];
    Passangers = AddressInfo.getPassangers(accounts);
    Airlines = AddressInfo.getAirlines(accounts);
    Flights = AddressInfo.getFlights(accounts);
    Oracles = AddressInfo.getOracles(accounts);
    let flightSuretyApp = new web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );

    flightSuretyApp.events.allEvents(
      {
        fromBlock: "latest"
      },
      async function(error, event) {
        try {
          // next line used during debug
          if (oraclesInfo.length === 0 && fs.existsSync(oraclesInfoFile)) {
            const data = fs.readFileSync(oraclesInfoFile, "utf8");
            const oInfo = JSON.parse(data);
            oInfo.map(o => oraclesInfo.push(o));
          }
          if (error) return console.log(error);
          if (event.event === "OracleRequest") {
            stopOnFSI = false;
            const { event: evnt, blockNumber, returnValues } = event;
            const { airline, flight, timestamp, index: idx } = returnValues;
            console.log(
              `>>> ${evnt} on block ${blockNumber} for airline ${airline}`
            );
            console.log(
              `Use ${idx} as the index for flight ${flight} at ${timestamp}`
            );
            for (let i = 0; i < oraclesInfo.length && !stopOnFSI; i++) {
              const oracleInfo = oraclesInfo[i];
              const oIdx = oracleInfo.indexs;
              if (idx === oIdx[0] || idx === oIdx[1] || idx === oIdx[2]) {
                //const airlineStatus = Math.floor(Math.random() * 5) * 10;
                // line below for debug
                const airlineStatus = Flights.filter(
                  f => f.number === flight
                )[0].status;
                console.log(
                  `${i} - ${idx} in ${oIdx} for oracle ${
                    oracleInfo.address
                  } status ${airlineStatus}`
                );
                try {
                  await flightSuretyApp.methods
                    .submitOracleResponse(
                      idx,
                      airline,
                      flight,
                      timestamp,
                      airlineStatus
                    )
                    .send({ from: oracleInfo.address, gas });
                } catch (e) {
                  //console.log("FSS reject expected", e); // for debug
                }
              } else {
                console.log(
                  `${i} - ${idx} not in ${oIdx} for oracle ${
                    oracleInfo.address
                  }`
                );
              }
            }
          } else {
            console.log(">>>", event.event, "on block", event.blockNumber);
            if (event.event === "FlightStatusInfo") stopOnFSI = true;
          }
        } catch (e) {
          console.log("FSS Error", e);
        }
      }
    );

    /*
    const oracles = Oracles.map(oracle => oracle.address);
    const totalOracles = await flightSuretyApp.methods
      .getNoOracles()
      .call({ gas });
    const value = await flightSuretyApp.methods
      .REGISTRATION_FEE()
      .call({ gas });

    for (let i = 0; i < oracles.length && totalOracles == 0; i++) {
      const from = oracles[i];
      await flightSuretyApp.methods.registerOracle().send({ from, value, gas });
      const r = await flightSuretyApp.methods.getMyIndexes().call({
        from
      });
      console.log(`${i}: Indexes ${r} registered for oracle ${from}`);
      oraclesInfo.push({ address: from, indexs: r });
    }
    // next line used during debugging
    fs.writeFileSync(
      oraclesInfoFile,
      JSON.stringify(oraclesInfo, null, 2),
      "utf8"
    );
    /* */
  } catch (e) {
    console.log("cj error seen", e.message);
  }
})();

const app = express();

app.get("/api/addressInfo", (_, res) => {
  if (accounts.length <= 0) {
    const msg = "Error. No accounts setup yet!";
    console.error(msg);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ msg }));
    return;
  }

  const addressInfo = { Airlines, Passangers, Flights, Oracles };
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(addressInfo, null, 2));
});

app.get("/api", (req, res) => {
  res.send({
    message: "An API for use with your Dapp!"
  });
});

export default app;
