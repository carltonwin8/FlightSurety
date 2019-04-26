/* process the ganache-cli output log to provide less data */

const fs = require("fs");

if (process.argv.length < 3) {
  console.error("Exiting! Need a file name.");
  process.exit(-1);
}
const dataBuf = fs.readFileSync(process.argv[2]);
const data = `${dataBuf}`.split("\n");

for (let index = 0; index < data.length; index++) {
  const line = data[index];
  const trimed = line.trimEnd();
  const idx = `0000${index + 1}`.substring(-4);
  if (trimed.length !== line.length) console.log(idx, "trim", line);
  if (line.length > 80) console.log(idx, "long line", line);
}
