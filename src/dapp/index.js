import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", async error => {
    // Read transaction
    if (error) return (DOM.elid("cos-value").innerHTML = error);

    let isOperational;
    const opStatu = DOM.elid("cos-value");
    try {
      isOperational = await new Promise(resolve => {
        contract.isOperational((error, result) => {
          if (error) {
            opStatu.textContent =
              "Error! Accessing the contract. Verify it is deployed.";
            console.log(error);
            return resolve(false);
          }
          opStatu.innerHTML = `${result}`;
          return resolve(true);
        });
      });
    } catch (e) {
      const msg = "Error! Contract not operational. Details on console.";
      console.log(msg, e);
      opStatu.value = msg;
      return;
    }
    if (!isOperational) return;

    await displayDcBalance(contract);

    displayAirlines(contract, DOM.elid("fa-airline"));
    DOM.elid("fund-airline").addEventListener("click", () => fa(contract));
    contract.getFundAirlineEvent(msg => displayStatus(msg, "fa"));

    displayAirlines(contract, DOM.elid("ra-airline"), 1);
    displayAirlines(contract, DOM.elid("ra-by"));
    DOM.elid("register-airline").addEventListener("click", () => ra(contract));
    contract.getRegisterAirlineEvent(msg => displayStatus(msg, "ra"));

    displayFlights(contract, DOM.elid("rf-flight"));
    DOM.elid("register-flight").addEventListener("click", () => rf(contract));
    contract.getRegisterFlightEvent(msg => displayStatus(msg, "rf"));

    displayPassangers(contract, DOM.elid("bi-passangers"));
    displayFlights(contract, DOM.elid("bi-flight"));
    DOM.elid("buy-insurance").addEventListener("click", () => bi(contract));
    contract.getBuyInsuranceEvent(msg => displayStatus(msg, "bi"));

    displayFlights(contract, DOM.elid("rs-flight"));
    DOM.elid("request-status").addEventListener("click", () => rs(contract));
    contract.getFlightStatusInfoEvent(msg => displayStatus(msg, "rs"));

    displayPassangers(contract, DOM.elid("ci-passangers"));
    //displayFlights(contract, DOM.elid("ci-flight"));
    DOM.elid("claim-insurance").addEventListener("click", () => ci(contract));
    contract.getClaimInsuranceEvent(msg => displayStatus(msg, "ci"));
  });
})();

function displayAirlines(contract, select, dflt) {
  contract.airlinesInfo.map(airline => {
    let option = DOM.makeElement(
      `option`,
      { value: `${airline.address}` },
      `${airline.name}`
    );
    select.appendChild(option);
  });
  if (dflt) select.selectedIndex = dflt;
}

function displayFlights(contract, select) {
  contract.flightsInfo.map(flight => {
    const airline = contract.airlinesInfo.filter(
      airline => airline.address === flight.address
    )[0];
    let option = DOM.makeElement(
      `option`,
      {
        "data-flight": `${flight.number}`,
        "data-time": `${flight.timestamp}`,
        "data-airline": `${airline.address}`
      },
      `${flight.number} @ ${flight.timestamp} on ${airline.name}`
    );
    select.appendChild(option);
  });
}

function displayPassangers(contract, select) {
  contract.passangersInfo.map(passanger => {
    let option = DOM.makeElement(
      `option`,
      { value: `${passanger.address}` },
      `${passanger.name}`
    );
    select.appendChild(option);
  });
}

function getAirline(select) {
  const selected = select.options[select.selectedIndex];
  const airline = selected.getAttribute("value");
  const name = selected.text;
  return { name, airline };
}

const err = (e, msgIn, container) => {
  const msg = `Error, ${msgIn}`;
  console.log(msg, e);
  displayStatus(msg, container);
};

async function fa(contract) {
  const { airline, name } = getAirline(DOM.elid("fa-airline"));
  const amount = DOM.elid("fa-amount").value;
  let msg = `Funding ${name} Airline.`;
  displayStatus(msg, "fa");
  try {
    await contract.fundAirline(airline, amount);
  } catch (e) {
    err(e, msg, "fa");
  }
}

function displayStatus(msg, dst) {
  removeStatus(dst);
  const btn = DOM.makeElement(
    "btn",
    { class: "btn-clr", id: `${dst}-clear` },
    "Clear"
  );
  const row = DOM.div({ class: "row status", id: `${dst}Status` }, msg);
  row.appendChild(btn);
  DOM.elid(dst).appendChild(row);
  DOM.elid(`${dst}-clear`).addEventListener("click", () => removeStatus(dst));
  displayDcBalance();
}

function removeStatus(dst) {
  const status = DOM.elid(`${dst}Status`);
  if (status) status.remove();
}

async function ra(contract) {
  const { airline, name } = getAirline(DOM.elid("ra-airline"));
  const { airline: byAirline, name: byName } = getAirline(DOM.elid("ra-by"));
  let msg = `${byName} registering ${name}.`;
  displayStatus(msg, "ra");
  try {
    await contract.registerAirline(airline, byAirline);
  } catch (e) {
    err(e, msg, "ra");
  }
}

function getFlight(select) {
  const selected = select.options[select.selectedIndex];
  const flight = selected.getAttribute("data-flight");
  const timestamp = selected.getAttribute("data-time");
  const airline = selected.getAttribute("data-airline");
  const description = selected.text;
  return { airline, flight, timestamp, description };
}

async function rf(contract) {
  const { airline, flight, timestamp, description } = getFlight(
    DOM.elid("rf-flight")
  );
  let msg = `Registering flight ${description}.`;
  displayStatus(msg, "rf");
  try {
    await contract.registerFlight(airline, flight, timestamp);
  } catch (e) {
    err(e, msg, "rf");
  }
}

function getPassanger(select) {
  const selected = select.options[select.selectedIndex];
  const address = selected.getAttribute("value");
  const name = selected.text;
  return { name, address };
}

async function bi(contract) {
  const { airline, flight, timestamp, description } = getFlight(
    DOM.elid("bi-flight")
  );
  const { name, address } = getPassanger(DOM.elid("bi-passangers"));
  const amount = DOM.elid("bi-amount").value;
  let msg = `Buying insurance for ${name} on flight ${description} for ${amount} ethers.`;
  displayStatus(msg, "bi");
  try {
    await contract.buyInsurance(airline, flight, timestamp, address, amount);
  } catch (e) {
    err(e, msg, "bi");
  }
}

async function rs(contract) {
  const { airline, flight, timestamp, description } = getFlight(
    DOM.elid("rs-flight")
  );
  let msg = `Fetching flight status for ${description}.`;
  displayStatus(msg, "rs");
  try {
    await contract.fetchFlightStatus(airline, flight, timestamp);
  } catch (e) {
    err(e, msg, "rs");
  }
}

async function ci(contract) {
  /*
  const { airline, flight, timestamp, description } = getFlight(
    DOM.elid("ci-flight")
  );
  */
  const { name, address } = getPassanger(DOM.elid("ci-passangers"));
  let msg = `Claiming insurance for ${name} on ${description}.`;
  displayStatus(msg, "ci");
  try {
    await contract.claimInsurance(address);
  } catch (e) {
    err(e, msg, "ci");
  }
}

async function displayDcBalance(contract) {
  try {
    const balance = await contract.dataContractBalance();
    DOM.elid("dc-balance").innerHTML = balance;
  } catch (e) {
    console.log("Getting data contract balance failed with error =>", e);
  }
}
