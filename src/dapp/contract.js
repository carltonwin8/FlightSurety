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

  async initialize(callback) {
    try {
      const accts = await this.web3.eth.getAccounts();
      if (!accts || accts.length === 0) {
        return callback("Error! Access To Etherum Blockchain Failed.");
      }
      this.owner = accts[0];
      this.airlinesInfo = AddressInfo.getAirlines(accts);
      this.airlines = this.airlinesInfo.map(airline => airline.address);
      this.passangersInfo = AddressInfo.getPassangers(accts);
      this.passangers = this.passangersInfo.map(passanger => passanger.address);
      this.flightsInfo = AddressInfo.getFlights(accts);

      const isAuth = await this.flightSuretyData.methods
        .isAuthorized()
        .call({ from: this.config.appAddress });
      if (isAuth) return callback(null);
      await this.flightSuretyData.methods
        .authorizeCaller(this.config.appAddress)
        .send({ from: this.owner });
      return callback(null);
    } catch (e) {
      const msg = `Error! Blockchain up? Contract deployed? ${e}`;
      console.log(msg);
      callback(msg);
    }
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  async airlineState(airline) {
    return await this.flightSuretyData.methods.airlineState(airline).call();
  }

  async fundAirline(from, value) {
    return await this.flightSuretyApp.methods
      .fundAirline()
      .send({ from, value: this.web3.utils.toWei(value) });
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

  getFlightFundingEvent(msgcb) {
    this.flightSuretyData.events.Funded({ fromBlock: "latest" }, (err, res) => {
      if (err) return msgcb("Funding Failed");
      const { airline, value } = res.returnValues;
      const { name } = this.airlinesInfo.filter(a => a.address === airline)[0];
      msgcb(`Funded ${name} with ${this.web3.utils.fromWei(value)} ether.`);
    });
  }

  getRegisterAirlineEvent(cb) {
    this.flightSuretyData.events.RegisterAirline(
      { fromBlock: "latest" },
      (err, res) => cb(err, res)
    );
  }

  getFlightStatusInfoEvent(cb) {
    this.flightSuretyApp.events.FlightStatusInfo(
      { fromBlock: "latest" },
      (err, res) => cb(err, res)
    );
  }

  getAllEvents() {
    this.flightSuretyApp.events.allEvents({ fromBlock: "latest" }, (err, res) =>
      console.log(`event-A >>`, err, res)
    );
    this.flightSuretyData.events.allEvents(
      { fromBlock: "latest" },
      (err, res) => console.log(`event-D >>`, err, res)
    );
  }
}
