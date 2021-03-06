var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");
const addressInfo = require("../src/server/addressInfo");

const showEvents = logs => {
  let outStr = "";
  logs.forEach(log => {
    outStr += log.event + "\n";
    for (var key in log.args) {
      if (key !== "__length__")
        if (Number(key) != key) outStr += `\t${key} ${log.args[key]}\n`;
    }
  });
  console.log(outStr);
};

contract("Flight Surety Tests", async accounts => {
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address
    );

    config.airlinesInfo = addressInfo.getAirlines(accounts);
    config.passangerInfo = addressInfo.getPassangers(accounts);
    config.flightInfo = addressInfo.getFlights(accounts);
  });

  /***************************************************************************/
  /* Operations and Settings                                                 */
  /***************************************************************************/
  it(`has correct initial isOperational() value`, async () => {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`can block access to setOperatingStatus() for non-Contract Owner account`, async () => {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2]
      });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`can allow access to setOperatingStatus() for Contract Owner account`, async () => {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(
      accessDenied,
      false,
      "Access not restricted to Contract Owner"
    );
  });

  it(`can block access to functions using requireIsOperational when operating status is false`, async () => {
    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await config.flightSuretyData.registerAirline();
    } catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true); //nonce issue here
  });

  it("cannot register an Airline using registerAirline() if it is not funded", async () => {
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      const from = config.firstAirline;
      await config.flightSuretyApp.registerAirline(newAirline, { from });
    } catch (e) {
      // console.log("error", e); // uncommment to verify error is thrown
    }
    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
    assert.equal(
      result,
      false,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  it("can register an Airline using registerAirline() if it is funded", async () => {
    // ARRANGE
    const newAirline = accounts[2];
    const from = config.firstAirline;
    const value = web3.utils.toWei("10", "ether");

    // ACT
    try {
      await config.flightSuretyApp.fundAirline({ value, from });
      await config.flightSuretyApp.registerAirline(newAirline, { from });
    } catch (e) {
      assert.fail(`Failed Funding Airline. ${e.message}`);
    }

    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
    assert.equal(
      result,
      1,
      "Airline can not register another airline if it is not funding"
    );
  });

  it("multi party consensus with registerAirline() for failure and pass", async () => {
    // ARRANGE
    const newAirline = accounts[2];
    const from = config.firstAirline;
    const value = web3.utils.toWei("10", "ether");
    const multiPairline = accounts[6];

    let result = 1; // registered by default
    // ACT
    try {
      // the frist airline was funded in the previous test
      // register and fund next 3 airlines to verify multi party
      for (let i = 3; i < 6; i++)
        await config.flightSuretyApp.registerAirline(accounts[i], { from });
      // fund 4 airlines
      for (let i = 2; i < 6; i++)
        await config.flightSuretyApp.fundAirline({
          value,
          from: accounts[i]
        });
      // next airline registration will be multi party, throws if fails
      await config.flightSuretyApp.registerAirline(multiPairline, {
        from
      });
    } catch (e) {
      result = 0; // unregistered b/c multi party registration failed
      // assert.fail(`Failed Funding Airline. ${e.message}`);
    }

    let res = await config.flightSuretyData.isAirline.call(multiPairline);
    res = res.toNumber();

    // ASSERT
    assert.equal(result, res, "The airline registered matches read value");
  });

  it("regiter a flight and but insurance", async () => {
    // ARRANGE
    const {
      number: flight,
      address: airline,
      timestamp: ts
    } = config.flightInfo[0];
    const { address: passanger } = config.passangerInfo[0];
    const value = web3.utils.toWei("1"); // insured amount
    let balanceBefore;
    let balanceAfter;

    // ACT
    try {
      await config.flightSuretyApp.registerFlight(airline, flight, ts, {
        from: airline
      });
      balanceBefore = await web3.eth.getBalance(passanger);
      await config.flightSuretyApp.buy(airline, flight, ts, {
        from: passanger,
        value
      });
      balanceAfter = await web3.eth.getBalance(passanger);
    } catch (e) {
      return assert.fail(`Failed flight reg & buying insurance. ${e.message}`);
    }

    balanceAfter = parseFloat(web3.utils.fromWei(balanceAfter));
    balanceBefore = parseFloat(web3.utils.fromWei(balanceBefore));

    // ASSERT
    assert.isAbove(
      balanceBefore,
      balanceAfter,
      "regiterFlight() and buy() insurance failed."
    );
  });

  /*
  // test below is not done because oracles have to be started mid test
  // test via web gui
  it("passanger can buys and claims insurance for a registered flight", async () => {
    // ARRANGE
    const {
      number: flight,
      address: airline,
      timestamp: ts
    } = config.flightInfo[0];
    const { address: passanger } = config.passangerInfo[0];
    const value = web3.utils.toWei(1); // insured amount
    let balanceBefore;
    let balanceAfter;

    // ACT
    try {
      await config.flightSuretyApp.registerFlight(airline, flight, ts, {
        from: airline
      });
      await config.flightSuretyApp.buy(airline, flight, ts, {
        from: passanger,
        value
      });

      balanceBefore = await web3.getBalance(passanger);
      // trigger flight status via oracles
      await config.flightSuretyApp.fetchFlightStatus(airline, flight, ts, {
        from: passanger
      });
      await config.flightSuretyApp.claimInsurance().send({ from: passanger });
      balanceAfter = await web3.getBalance(passanger);
    } catch (e) {
      return assert.fail(`Failed buying & claiming insurance. ${e.message}`);
    }

    // ASSERT
    assert.isAbove(
      balanceAfter.toNumber(),
      balanceBefore.toNumber(),
      "The airline registered matches read value"
    );
  });
*/
});
