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

  getAllEvents() {
    try {
      this.flightSuretyApp.events.allEvents(
        { fromBlock: "latest" },
        (err, res) =>
          console.log(
            `event-A >>`,
            err,
            res && res.event ? res.event : "",
            res && res.returnValues ? res.returnValues : ""
          )
      );
      this.flightSuretyData.events.allEvents(
        { fromBlock: "latest" },
        (err, res) =>
          console.log(
            `event-D >>`,
            err,
            res && res.event ? res.event : "",
            res && res.returnValues ? res.returnValues : ""
          )
      );
    } catch (e) {
      console.error("Failed getting events due to:", e);
    }
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  async fundAirline(from, value) {
    return await this.flightSuretyApp.methods
      .fundAirline()
      .send({ from, value: this.web3.utils.toWei(value) });
  }

  getAirlineNameFromAddress(address) {
    const { name } = this.airlinesInfo.filter(a => a.address === address)[0];
    return name;
  }
  getFundAirlineEvent(msgcb) {
    this.flightSuretyData.events.Funded({ fromBlock: "latest" }, (err, res) => {
      if (err) return msgcb("Funding Failed");
      const { airline, value } = res.returnValues;
      const name = this.getAirlineNameFromAddress(airline);
      msgcb(`Funded ${name} with ${this.web3.utils.fromWei(value)} ether.`);
    });
  }

  getStateStr(no) {
    switch (no) {
      case "0":
        return "Unregistered";
      case "1":
        return "Registered";
      case "2":
        return "Funded";
      default:
        return "Unknown";
    }
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
        const a = this.getAirlineNameFromAddress(airline);
        const rb = this.getAirlineNameFromAddress(reqBy);
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
        if (err) return msgcb("Registering Flight Failed");
        const { airline, flight, timestamp } = res.returnValues;
        const name = this.getAirlineNameFromAddress(airline);
        msgcb(`Registered Flight ${flight} @ ${timestamp} on ${name}`);
      }
    );
  }

  async buyInsurance(airline, flight, timestamp, passanger, amount) {
    return await this.flightSuretyApp.methods
      .buy(airline, flight, timestamp)
      .send({
        from: passanger,
        value: this.web3.utils.toWei(amount),
        gas: 2000000
      });
  }

  getPassanger = pa =>
    this.passangersInfo.filter(p => p.address === pa)[0].name;

  getBuyInsuranceEvent(msgcb) {
    this.flightSuretyData.events.Buy({ fromBlock: "latest" }, (err, res) => {
      if (err) return msgcb("Buying Insurance Failed");
      const {
        airline,
        flight,
        timestamp,
        passanger,
        amount
      } = res.returnValues;
      const al = this.getAirlineNameFromAddress(airline);
      const p = this.getPassanger(passanger);
      let msg = `Bought ${this.web3.utils.fromWei(amount)} ether worth of`;
      msg += ` insurance for ${p} on ${flight} @ ${timestamp} on ${al}.`;
      msgcb(msg);
    });
  }

  getFlightStatusStr(no) {
    switch (no) {
      case "0":
        return "Unknown";
      case "10":
        return "On Time";
      case "20":
        return "Late Airline";
      case "30":
        return "Late Weather";
      case "40":
        return "Late Technical";
      case "50":
        return "Late Other";
      default:
        return "Really Unknown";
    }
  }

  async fetchFlightStatus(airline, flight, timestamp) {
    await this.flightSuretyApp.methods
      .fetchFlightStatus(airline, flight, timestamp)
      .send({ from: this.owner });
  }

  getFlightStatusInfoEvent(msgcb) {
    this.flightSuretyApp.events.FlightStatusInfo(
      { fromBlock: "latest" },
      (err, res) => {
        if (err) return msgcb("Failed getting flight status");
        const { airline, flight, timestamp, status } = res.returnValues;
        const al = this.getAirlineNameFromAddress(airline);
        const ss = this.getFlightStatusStr(status);
        msgcb(`${flight} @ ${timestamp} on ${al} status was: ${ss}`);
      }
    );
  }

  async claimInsurance(address) {
    return await this.flightSuretyApp.methods
      .claimInsurance()
      .send({ from: address });
  }

  getClaimInsuranceEvent(msgcb) {
    this.flightSuretyData.events.Pay({ fromBlock: "latest" }, (err, res) => {
      if (err) return msgcb(`Failed getting payout. ${err}`);
      const { passanger, amount } = res.returnValues;
      const p = this.getPassanger(passanger);
      msgcb(`${p} payed ${this.web3.utils.fromWei(amount)} ether.`);
    });
  }

  async passangerCredit(address) {
    const credit = await this.flightSuretyApp.methods
      .passangerCredit()
      .call({ from: address, gas: 4712388, gasPrice: 100000000000 });
    return this.web3.utils.fromWei(credit);
  }

  async getContractBalances() {
    const dbal = await this.web3.eth.getBalance(this.config.dataAddress);
    const data = this.web3.utils.fromWei(dbal);
    const abal = await this.web3.eth.getBalance(this.config.appAddress);
    const app = this.web3.utils.fromWei(abal);
    return { data, app };
  }

  async getBalances() {
    const passangers = [];
    for (let i = 0; i < this.passangersInfo.length; i++) {
      const p = this.passangersInfo[i];
      const b = await this.web3.eth.getBalance(p.address);
      const bal = this.web3.utils.fromWei(b);
      const [n, d] = bal.split(".");
      const den = d ? d.slice(0, 4) : "0000";
      const balance = `${n}.${den}`;
      passangers.push({ ...p, balance });
    }
    return [passangers];
  }
}
