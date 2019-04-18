import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", async error => {
    // Read transaction
    if (error) return (DOM.elid("cos-value").innerHTML = error);

    let isOperational;
    try {
      isOperational = await new Promise(resolve => {
        contract.isOperational((error, result) => {
          const opStatu = DOM.elid("cos-value");
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

    displayPassangers(contract);
    displayAirlines(contract, DOM.elid("bi-flight"));
    const ra = DOM.elid("ra-airline");
    displayAirlines(contract, ra);
    ra.selectedIndex = 1; // default airline to reg is second one
    displayAirlines(contract, DOM.elid("ra-by"));
    displayAirlines(contract, DOM.elid("fa-airline"));
    displayFlights(contract, DOM.elid("flight-number"));
    displayFlights(contract, DOM.elid("ci-flight-number"));

    DOM.elid("register-airline").addEventListener("click", () =>
      register_airline(contract)
    );
    DOM.elid("request-status").addEventListener("click", () =>
      req_flight_click(contract)
    );
    contract.getFlightStatusInfoEvent((err, res) =>
      req_flight_result(contract, err, res)
    );

    contract.getAllEvents((err, res, prompt) => {
      console.log(`event${prompt} >>`, err, res);
    });
  });
})();

function displayPassangers(contract) {
  let passangerSelect = DOM.elid("bi-passangers");

  contract.passangersInfo.map(passanger => {
    let option = DOM.makeElement(
      `option`,
      { value: `${passanger.address}` },
      `${passanger.name}`
    );
    passangerSelect.appendChild(option);
  });
}

function displayAirlines(contract, select) {
  contract.airlinesInfo.map(airline => {
    let option = DOM.makeElement(
      `option`,
      { value: `${airline.address}` },
      `${airline.name}`
    );
    select.appendChild(option);
  });
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

function register_airline(contract) {
  const { airline, name } = getAirline(DOM.elid("ra-airline"));
  const { airline: byAirline, name: byName } = getAirline(DOM.elid("ra-by"));
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
}

function req_flight_click(contract) {
  const flightSelect = DOM.elid("flight-number");
  const selected = flightSelect.options[flightSelect.selectedIndex];
  const flight = selected.getAttribute("data-flight");
  const timestamp = selected.getAttribute("data-time");
  const airline = selected.getAttribute("data-airline");
  console.log(contract);
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
