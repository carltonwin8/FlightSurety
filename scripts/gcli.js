/* process the ganache-cli output log to provide less data */

const fs = require("fs");

(async () => {
  const dataBuf = fs.readFileSync("./gcli.log");
  const data = `${dataBuf}`.split("\n");
  const d = data.reduce(
    ({ save, acc }, d) => {
      if (save) return { save, acc: [...acc, d] };
      if (d.includes("Listening on 127")) return { save: true, acc };
      return { save, acc };
    },
    { save: false, acc: [] }
  ).acc;
  const dout = d.reduce(
    (a, d) =>
      d.includes("eth_getBlockByNumber") ||
      d.includes("net_version") ||
      d.includes("eth_getTransactionReceipt") ||
      d.includes("eth_getCode") ||
      d.includes("eth_estimateGas") ||
      d.includes("eth_blockNumber") ||
      d.includes("eth_sendRawTransaction") ||
      d.includes("eth_call") ||
      d.includes("eth_getTransactionCount") ||
      d.includes("snapshot")
        ? a
        : [...a, d],
    []
  );
  dout.map(line => console.log(line));
})();
