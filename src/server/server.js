import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";
import FlightInfo from "./flightInfo.json";
import fs from "fs";

const oraclesInfo = [];
const oraclesInfoFile = "oraclesInfo.log";
let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);

(async () => {
  try {
    const gas = 2000000;
    const accounts = await web3.eth.getAccounts();
    web3.eth.defaultAccount = accounts[0];

    let flightSuretyApp = new web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );

    flightSuretyApp.events.allEvents(
      {
        fromBlock: 0
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
            const { event: evnt, blockNumber, returnValues } = event;
            const { airline, flight, timestamp, index: idx } = returnValues;
            console.log(
              `${evnt} on block ${blockNumber} for airline ${airline} and`
            );
            console.log(
              `oracle index ${idx} for flight ${flight} at time ${timestamp}.`
            );
            for (let i = 0; i < oraclesInfo.length; i++) {
              const oracleInfo = oraclesInfo[i];
              const oIdx = oracleInfo.indexs;
              if (idx === oIdx[0] || idx === oIdx[1] || idx === oIdx) {
                //const airlineStatus = Math.floor(Math.random() * 5) * 10;
                const airlineStatus = 10; // for debug
                //const airlineStatus = 20; // for debug
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
            console.log(event.event, "on block", event.blockNumber);
          }
        } catch (e) {
          console.log("FSS Error", e);
        }
      }
    );

    /* 
    const oracles = accounts.slice(5, 25);
    const value = await flightSuretyApp.methods.REGISTRATION_FEE().call();

    for (let i = 0; i < oracles.length; i++) {
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

app.get("/api/flightinfo", (req, res) => {
  res.send(FlightInfo);
});

app.get("/api", (req, res) => {
  res.send({
    message: "An API for use with your Dapp!"
  });
});

export default app;
