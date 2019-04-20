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
      if (!isAuth) {
        await this.flightSuretyData.methods
          .authorizeCaller(this.config.appAddress)
          .send({ from: this.owner });
      }
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

  getFundAirlineEvent(msgcb) {
    this.flightSuretyData.events.Funded({ fromBlock: "latest" }, (err, res) => {
      if (err) return msgcb("Funding Failed");
      const { airline, value } = res.returnValues;
      const { name } = this.airlinesInfo.filter(a => a.address === airline)[0];
      msgcb(`Funded ${name} with ${this.web3.utils.fromWei(value)} ether.`);
    });
  }

  async registerAirline(airline, requestedBy) {
    return await this.flightSuretyApp.methods
      .registerAirline(airline)
      .send({ from: requestedBy, gas: 2000000 });
  }

  getRegisterAirlineEvent(msgcb) {
    this.flightSuretyData.events.RegisterAirline(
      { fromBlock: "latest" },
      (err, res) => {
        if (err) return msgcb("Registering Airline Failed");
        const { airline, reqBy, as1, as2 } = res.returnValues;
        const { name: a } = this.airlinesInfo.filter(
          a => a.address === airline
        )[0];
        const { name: rb } = this.airlinesInfo.filter(
          a => a.address === reqBy
        )[0];
        const s1 = this.getStateStr(as1);
        const s2 = this.getStateStr(as2);
        msgcb(`${rb} registered ${a}. Relative states ${s2} and ${s1}`);
      }
    );
  }

  async registerFlight(airline, flight, timestamp) {
    return await this.flightSuretyApp.methods
      .registerFlight(airline, flight, timestamp)
      .send({ from: airline, gas: 2000000 });
  }

  getRegisterFlightEvent(msgcb) {
    this.flightSuretyData.events.RegisteredFlight(
      { fromBlock: "latest" },
      (err, res) => {
        if (err) return msgcb("Registering Airline Failed");
        const { airline, flight, timestamp } = res.returnValues;
        const { name } = this.airlinesInfo.filter(
          a => a.address === airline
        )[0];
        msgcb(`Registered Flight ${flight} @ ${timestamp} on ${name}`);
      }
    );
  }

  async buyInsurance(airline, flight, timestamp, passanger) {
    return await this.flightSuretyApp.methods
      .registerAirline(airline)
      .send({ from: requestedBy, gas: 2000000 });
  }

  getBuyInsuranceEvent(msgcb) {
    this.flightSuretyData.events.Funded({ fromBlock: "latest" }, (err, res) => {
      if (err) return msgcb("Funding Failed");
      const { airline, value } = res.returnValues;
      const { name } = this.airlinesInfo.filter(a => a.address === airline)[0];
      msgcb(`Funded ${name} with ${this.web3.utils.fromWei(value)} ether.`);
    });
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
    this.flightSuretyApp.events.allEvents({ fromBlock: "latest" }, (err, res) =>
      console.log(`event-A >>`, err, res)
    );
    this.flightSuretyData.events.allEvents(
      { fromBlock: "latest" },
      (err, res) => console.log(`event-D >>`, err, res)
    );
  }

  getStateStr(no) {
    if (no === 0) return "Unregistered";
    if (no === 1) return "Registered";
    if (no === 2) return "Funded";
    return "Unknown";
  }
}
