import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      const opStatu = DOM.elid("cos-value");
      if (error) return opStatu.value("Error");
      opStatu.innerHTML = `${result}`;
    });

    // User-submitted transaction
    DOM.elid("request-status").addEventListener("click", () => {
      const flightSelect = DOM.elid("flight-number");
      const flight = flightSelect.options[flightSelect.selectedIndex].text;
      // Write transaction
      contract.fetchFlightStatus(flight, (error, result) => {
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            error: error,
            value: result.flight + " " + result.timestamp
          }
        ]);
      });
    });

    displayPassangers(contract);
    displayAirlines(contract, DOM.elid("bi-flight"));
    displayAirlines(contract, DOM.elid("ca-airline"));
    displayAirlines(contract, DOM.elid("fa-airline"));
    displayFlights(contract, DOM.elid("flight-number"));
    displayFlights(contract, DOM.elid("ci-flight-number"));
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper2");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map(result => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}

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
      { value: `${flight.address}` },
      `${flight.number} @ ${flight.timestamp} on ${airline.name}`
    );
    select.appendChild(option);
  });
}

function updateFlightDetails(contract, flightSelect, select) {
  const flightAddress = flightSelect.options[flightSelect.selectedIndex].value;
  const flight = contract.flightsInfo.filter(
    flight => flight.address === flightAddress
  )[0];
  console.log("flight", flightAddress, flight);
  select.innerHTML = `${flight.address}`;
}
