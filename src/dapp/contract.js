import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";
import AddressInfo from "../server/addressInfo";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.config = config;
    this.web3 = new Web3(
      new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
    );
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.flightSuretyData = new this.web3.eth.Contract(
      FlightSuretyData.abi,
      config.dataAddress
    );
    this.getAllEvents();
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      if (!accts || accts.length === 0) {
        return callback("Error! Access To Etherum Blockchain Failed.");
      }
      this.owner = accts[0];

      this.airlinesInfo = AddressInfo.getAirlines(accts);
      this.airlines = this.airlinesInfo.map(airline => airline.address);
      this.passangersInfo = AddressInfo.getPassangers(accts);
      this.passangers = this.passangersInfo.map(passanger => passanger.address);
      this.flightsInfo = AddressInfo.getFlights(accts);

      this.flightSuretyData.methods
        .isAuthorized()
        .call({ from: this.config.appAddress }, (e, r) => {
          if (e) return callback("Error! Verifying authorization");
          console.log("auth", r);
          if (r) return callback(null);
          this.flightSuretyData.methods
            .authorizeCaller(this.config.appAddress)
            .call((e, r) => {
              console.log("auth status", e, r);
              if (e)
                return callback(
                  "Error! Granting access to data contract from app contract."
                );
              return callback(null);
            });
        });
    });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  registerAirline(airline, requestedBy, callback) {
    try {
      this.flightSuretyApp.methods
        .registerAirline(airline)
        .send({ from: requestedBy, gas: 2000000 }, (error, result) => {
          callback(error, result);
        });
    } catch (e) {
      console("reg air err", e);
    }
  }
  fetchFlightStatus(airline, flight, timestamp, callback) {
    this.flightSuretyApp.methods
      .fetchFlightStatus(airline, flight, timestamp)
      .send({ from: this.owner }, (error, result) => {
        callback(error, result);
      });
  }

  getFlightStatusInfoEvent(cb) {
    this.flightSuretyApp.events.FlightStatusInfo(
      { fromBlock: "latest" },
      (err, res) => cb(err, res)
    );
  }

  getAllEvents() {
    this.flightSuretyApp.events.allEvents({ fromBlock: 0 }, (err, res) =>
      console.log(`event-A >>`, err, res)
    );
    this.flightSuretyData.events.allEvents({ fromBlock: 0 }, (err, res) =>
      console.log(`event-A >>`, err, res)
    );
  }
}
