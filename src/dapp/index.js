import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", async error => {
    // Read transaction
    if (error) return (DOM.elid("cos-value").innerHTML = error);

    let isOper;
    const opStatu = DOM.elid("cos-value");
    try {
      isOper = await new Promise(resolve => {
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
    if (!isOper) return;

    await displayBalance(contract);

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
    DOM.elid("claim-insurance").addEventListener("click", () => ci(contract));
    DOM.elid("view-credit").addEventListener("click", () => vc(contract));
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
  await displayBalance(contract);
}

function displayStatus(msg, dst) {
  removeStatus(dst);
  const btn = DOM.makeElement(
    "btn",
    { class: "btn-clr", id: `${dst}-clear` },
    "Clear"
  );
  const row = DOM.div({ class: "row status", id: `${dst}Status` }, msg);
  row.insertBefore(btn, row.firstChild);
  DOM.elid(dst).appendChild(row);
  DOM.elid(`${dst}-clear`).addEventListener("click", () => removeStatus(dst));
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
  await displayBalance(contract);
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
  await displayBalance(contract);
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
  let msg = `Buying insurance for ${name} on flight `;
  msg += `${description} for ${amount} ethers.`;
  displayStatus(msg, "bi");
  try {
    await contract.buyInsurance(airline, flight, timestamp, address, amount);
  } catch (e) {
    err(e, msg, "bi");
  }
  await displayBalance(contract);
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
  await displayBalance(contract);
}

async function ci(contract) {
  const { name, address } = getPassanger(DOM.elid("ci-passangers"));
  let msg = `Claiming insurance for ${name}.`;
  displayStatus(msg, "ci");
  try {
    await contract.claimInsurance(address);
  } catch (e) {
    err(e, msg, "ci");
  }
  await displayBalance(contract);
}

async function vc(contract) {
  const { name, address } = getPassanger(DOM.elid("ci-passangers"));
  let msg = `Getting insurance for ${name}.`;
  displayStatus(msg, "ci");
  try {
    const credit = await contract.passangerCredit(address);
    msg = `${name} has a credit of ${credit} ether.`;
    displayStatus(msg, "ci");
  } catch (e) {
    err(e, msg, "ci");
  }
  await displayBalance(contract);
}

async function displayBalance(contract) {
  try {
    const { data, app } = await contract.getContractBalances();
    DOM.elid("dc-balance").innerHTML = data;
    DOM.elid("ac-balance").innerHTML = app;
    const groups = await contract.getBalances();
    displayBalances(groups);
  } catch (e) {
    console.log("Getting data contract balance failed with error =>", e);
  }
}

async function displayBalances(groups) {
  const grpBndry = [];
  groups.map(group => grpBndry.push(group.length));
  const elements = grpBndry.reduce((a, b) => a + b, 0);

  let idx = 0;
  let group = 0;
  let groupIdx = 0;
  const COLS = 2;
  let ROWS = elements / 2;
  if (elements % ROWS) ROWS++;

  const table = DOM.makeElement(`table`, { id: "removeTable" });
  for (let row = 0; row < ROWS; row++) {
    const tr = DOM.makeElement(`tr`);
    for (let col = 0; col < 2; col++) {
      idx = row + col;
      if (idx === grpBndry[group]) {
        groupIdx = 0;
        group++;
      }
      const item = groups[group][groupIdx];
      let td = DOM.makeElement(`td`, { class: "first" }, item.name);
      tr.appendChild(td);
      td = DOM.makeElement(`td`, item.balance);
      tr.appendChild(td);
      groupIdx++;
    }
    table.appendChild(tr);
  }
  const oldTable = DOM.elid("removeTable");
  if (oldTable) oldTable.parentNode.removeChild(oldTable);
  balances.appendChild(table);
}
