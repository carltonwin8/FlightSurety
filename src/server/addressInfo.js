const addressesIsInvalid = (addresses, startIndex, req, msg) => {
  if (!addresses) {
    console.error(`Error! No addresses provided. ${msg}`);
    return true;
  }
  if (address.length < startIndex) {
    console.error(`Error! Start index greater than address. ${msg}`);
    return true;
  }
  return false;
};

const getUsers = (addresses, startIndex = 8) => {
  const users = [{ name: "John Doe" }, { name: "Jane Smith" }];
  if (addressesIsInvalid(addresses, startIndex, users.length, "getUsers"))
    return null;
  return users.map(({ name }, idx) => {
    name, addresses[startIndex + index];
  });
};

const getAirlines = (addresses, startIndex =1) => {
  const airlines = [
      { name: "South West" },
      { name: "America" },
      { name: "Qantas" },
      { name: "Alaska" },
      { name: "Cathay" },
      { name: "South West" }
    ]
    if (addressesIsInvalid(addresses, startIndex, users.length, "getUsers"))
    return null;
  return users.map((airline, idx) => ({
    ...airline, addresses[startIndex + index]
  }));
}
const hi = {
  airlinesInfo: {
    startAddress: 1,

  },
  flights: [
    {
      airlineAddress: 0,
      flight: "ND1309",
      timestamp: "1554952974",
      status: 0
    },
    {
      address: 1,
      flight: "ND1310",
      timestamp: "1554952975",
      status: 10
    },
    {
      address: 2,
      flight: "ND1311",
      timestamp: "1554952976",
      status: 20
    },
    {
      address: 3,
      flight: "ND1312",
      timestamp: "1554952977",
      status: 30
    },
    {
      address: 10,
      flight: "ND1313",
      timestamp: "1554952978",
      status: 40
    },
    {
      address: 20,
      flight: "ND1314",
      timestamp: "1554952979",
      status: 50
    }
  ]
};

exports = {
  getAirlines,
  get
};
