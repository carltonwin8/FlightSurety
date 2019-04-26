var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");

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
      true,
      "Airline can register another airline if it has provided funding"
    );
  });
});
