import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display([
        { label: "Contract Operational Status", error: error, value: result }
      ]);
    });

    // User-submitted transaction
    DOM.elid("request-status").addEventListener("click", () => {
      let flight = DOM.elid("flight-number").value;
      // Write transaction
      contract.fetchFlightStatus(flight, (error, result) => {
        display2("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            error: error,
            value: result.flight + " " + result.timestamp
          }
        ]);
      });
    });
  });
})();

function display(results) {
  let displayDiv = DOM.elid("display-wrapper");
  results.map(result => {
    let row = displayDiv.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-8 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-4 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    displayDiv.appendChild(row);
  });
}

function display2(title, description, results) {
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
