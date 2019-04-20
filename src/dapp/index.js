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
    contract.getFlightStatusInfoEvent((err, res) =>
      req_flight_result(contract, err, res)
    );

    displayPassangers(contract, DOM.elid("ci-passangers"));
    displayFlights(contract, DOM.elid("ci-flight"));
  });
})();

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

function getAirline(select) {
  const selected = select.options[select.selectedIndex];
  const airline = selected.getAttribute("value");
  const name = selected.text;
  return { name, airline };
}

async function fa(contract) {
  const { airline, name } = getAirline(DOM.elid("fa-airline"));
  const amount = DOM.elid("fa-amount").value;
  let msg = `Funding ${name} Airline.`;
  displayStatus(msg, "fa");
  try {
    await contract.fundAirline(airline, amount);
  } catch (e) {
    msg = `Error, ${msg}`;
    console.log(msg, e);
    displayStatus(msg, "fa");
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
}

function removeStatus(dst) {
  const status = DOM.elid(`${dst}Status`);
  if (status) status.remove();
}

function ra(contract) {
  const { airline, name } = getAirline(DOM.elid("ra-airline"));
  const { airline: byAirline, name: byName } = getAirline(DOM.elid("ra-by"));
  try {
    contract.registerAirline(airline, byAirline, (error, result) => {
      let msg = `Creating Airline For - ${name}.`;
      if (error) msg = `Error, ${msg} ${error}`;
      console.log("error", error);
      console.log("result", result);
      contract.web3.eth.getTransaction(result, (e, r) => {
        console.log("e", e);
        console.log("r", r);
      });
    });
  } catch (e) {
    console("reg air err", e);
  }
}

function rf(contract) {
  const { number, timestamp } = getFlight(DOM.elid("rf-flight"));
  try {
    contract.registerAirline(airline, byAirline, (error, result) => {
      let msg = `Creating Airline For - ${name}.`;
      if (error) msg = `Error, ${msg} ${error}`;
      console.log("error", error);
      console.log("result", result);
      contract.web3.eth.getTransaction(result, (e, r) => {
        console.log("e", e);
        console.log("r", r);
      });
    });
  } catch (e) {
    console("reg air err", e);
  }
}

function getFlight(select) {
  const selected = select.options[select.selectedIndex];
  const airline = selected.getAttribute("value");
  const name = selected.text;
  return { name, airline };
}

function bi(contract) {
  const flightSelect = DOM.elid("bi-flight");
  const selected = flightSelect.options[flightSelect.selectedIndex];
  const flight = selected.getAttribute("data-flight");
  const timestamp = selected.getAttribute("data-time");
  const airline = selected.getAttribute("data-airline");
  contract.fetchFlightStatus(airline, flight, timestamp, (error, result) => {
    let msg = `Fetching Flight Status For - ${flight}.`;
    if (error) msg = `Error, ${msg} ${error}`;
    display_rsStatus(msg);
  });
}

function rs(contract) {
  const flightSelect = DOM.elid("rs-flight");
  const selected = flightSelect.options[flightSelect.selectedIndex];
  const flight = selected.getAttribute("data-flight");
  const timestamp = selected.getAttribute("data-time");
  const airline = selected.getAttribute("data-airline");
  contract.fetchFlightStatus(airline, flight, timestamp, (error, result) => {
    let msg = `Fetching Flight Status For - ${flight}.`;
    if (error) msg = `Error, ${msg} ${error}`;
    display_rsStatus(msg);
  });
}

function req_flight_result(contract, err, res) {
  const airline = contract.airlinesInfo.filter(
    airline => airline.address === res.returnValues.airline
  )[0].name;
  let msg = `Fetched Flight Status Of ${res.returnValues.status} For - ${
    res.returnValues.flight
  } @ ${res.returnValues.timestamp} on ${airline}`;
  if (err) msg = `Error, ${msg} ${err}`;
  display_rsStatus(msg);
}

function display_rsStatus(msg) {
  remove_rsStatus();
  const btn = DOM.makeElement(
    "btn",
    { class: "btn-clr", id: "request-status-clear" },
    "Clear"
  );
  const row = DOM.div({ class: "row", id: "rsStatus" }, msg);
  row.appendChild(btn);
  DOM.elid("rs").appendChild(row);
  DOM.elid("request-status-clear").addEventListener("click", remove_rsStatus);
}

function remove_rsStatus() {
  const rsStatus = DOM.elid("rsStatus");
  if (rsStatus) rsStatus.remove();
}
