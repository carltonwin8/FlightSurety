/* use in the truffle console to get account balances */
module.exports = function(cb) {
  console.log("account balances");
  let p = Promise.resolve();
  let count = 0;
  const addresses = web3.eth.accounts._provider.addresses;
  for (let i = 0; i < 30; i++) {
    const a = addresses[i];
    p = p
      .then(() => web3.eth.getBalance(a))
      .then(b => console.log(count++, b, a));
  }
  p.then(() => console.log("finished"));
  return p.then(() => {
    if (cb) return cb();
  });
};
