import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";
import FlightInfo from "./flightInfo.json";

let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);

(async () => {
  const accounts = await web3.eth.getAccounts();
  web3.eth.defaultAccount = accounts[0];

  let flightSuretyApp = new web3.eth.Contract(
    FlightSuretyApp.abi,
    config.appAddress
  );

  flightSuretyApp.events.OracleRequest(
    {
      fromBlock: 0
    },
    function(error, event) {
      if (error) console.log(error);
      console.log(event);
    }
  );
  console.log("version", web3.version);
  const oracles = accounts.slice(5, 25);
  const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
  /*
  console.log("events", flightSuretyApp.events);
  console.log("reg", flightSuretyApp.methods.REGISTRATION_FEE.call());
  console.log("address", flightSuretyApp.address);
  */
  console.log("fee", fee);
  /*
  for (let i = 0; i < accounts.length; i++) {
    const from = accounts[i];
    await flightSuretyApp.regiserOracle({ from, value });
    const r = await config.flightSuretyApp.getMyIndexes.call({ from });
    console.log(`Oracle Registered: ${r[0]}, ${r[1]}, ${r[2]} ${from}`);
  }
*/
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
