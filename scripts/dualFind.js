const { execSync, exec } = require("child_process");

if (process.argv.length < 3) return console.error("Enter string to search");

const findc = ftype =>
  `find . -name "${ftype}" -not -path "*/node_modules/*" -not -path "*/prod/*"`;

const sols = execSync(findc("*.sol"))
  .toString()
  .split("\n");

const jss = execSync(findc("*.js"))
  .toString()
  .split("\n");

const strsFixed = [
  "isOperational",
  "registerAirline",
  "fundAirline",
  "registerFlight",
  "buy",
  "processFlightStatus",
  "fetchFlightStatus",
  "claimInsurance",
  "passangerCredit",
  "getNoOracles",
  "registerOracle",
  "getMyIndexes",
  "submitOracleResponse",
  "generateIndexes",
  "getRandomIndex"
];

const strs = process.argv[2] !== "fixed" ? [process.argv[2]] : strsFixed;

strs.map(
  str =>
    console.log(`========================== ${str} ========================`) ||
    [...sols, ...jss].map(file => {
      if (file.includes("dualFind.js")) return;
      const cmd = `grep -nH ${str} ${file}`;
      try {
        console.log(execSync(cmd).toString());
      } catch (e) {
        //console.error("Error on:", cmd); // grep with no results, errors out
        // there is also e.status e.stdout, e.stderr, e.message
      }
    })
);
