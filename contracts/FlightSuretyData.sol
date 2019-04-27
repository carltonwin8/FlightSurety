pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
  using SafeMath for uint256;

  /*************************************************************************/
  /*                                       DATA VARIABLES                   /
  /*************************************************************************/
  address private contractOwner;
  bool private operational = true;
  uint8 airlinesNo = 0;
  mapping(address => uint256) private authorizedContracts;
  enum AirlineState { Unregistered, Registered, Funded }
  mapping(address => AirlineState) private airlines;
  struct Passanger { address adr; uint256 amount; }
  struct Flight { bool insured; Passanger []passangers; }
  mapping(bytes32 => Flight) insuredFlight;
  mapping(bytes32 => bool) insuredPassanger;
  mapping(address => uint256) insurancePayout;
  /*************************************************************************/
  /*                                       EVENT DEFINITIONS                /
  /*************************************************************************/

  /**
  * @dev Constructor
  *      The deploying account becomes contractOwner
  */
  constructor(address initialAirline)public
  {
    contractOwner = msg.sender;
    airlines[initialAirline] = AirlineState.Registered;
  }

  /*************************************************************************/
  /*                                       FUNCTION MODIFIERS               /
  /*************************************************************************/

  // Modifiers help avoid duplication of code. They are typically used to
  // validate something before a function is allowed to be executed.

  /**
  * @dev Modifier that requires the "operational" boolean variable to be "true"
  *      This is used on all state changing functions to pause the contract in
  *      the event there is an issue that needs to be fixed
  */
  modifier requireIsOperational()
  {
    require(operational, "Contract is currently not operational");
    _;
  }

  /**
  * @dev Modifier that requires the "ContractOwner" account to be the
  *      function caller
  */
  modifier requireContractOwner()
  {
    require(msg.sender == contractOwner, "Caller is not contract owner");
    _;
  }
  modifier isCallerAuthorized()
  {
    require(authorizedContracts[msg.sender] == 1, "Caller is not authorized");
    _;
  }
  modifier requireAirlineFunded(address adr)
  {
    require(airlines[adr] == AirlineState.Funded,
      "Airline not registered or not funded");
    _;
  }
  modifier requirePassangerFunded(address passanger)
  {
    require(insurancePayout[passanger] != 0,
      "Passanger does not exist, did not buy insurance, or flight on time");
    _;
  }
  /*************************************************************************/
  /*                                       UTILITY FUNCTIONS                /
  /*************************************************************************/

  /**
  * @dev Get operating status of contract
  * @return A bool that is the current operating status
  */
  function isOperational() public view returns(bool)
  {
    return operational;
  }

  function isAuthorized() public view returns(bool)
  {
    if (authorizedContracts[msg.sender] == 1) return true;
    return false;
  }

  /**
  * @dev Sets contract operations on/off
  * When operational mode is disabled, all write transactions except for this
  * one will fail
  */
  function setOperatingStatus(bool mode) external requireContractOwner
  {
    operational = mode;
  }

  function getFlightKey (
    address airline, string memory flight, uint256 timestamp
  ) pure internal returns(bytes32)
  {
    return keccak256(abi.encodePacked(airline, flight, timestamp));
  }

  function getPassangerKey (address passanger, bytes32 flightKey)
    pure internal returns(bytes32)
  {
    return keccak256(abi.encodePacked(passanger, flightKey));
  }

  /*************************************************************************/
  /*                                     SMART CONTRACT FUNCTIONS           /
  /*************************************************************************/
  function authorizeCaller(address adr) external requireContractOwner
  {
    authorizedContracts[adr] = 1;
  }

  function deauthorizeCaller(address adr) external requireContractOwner
  {
    delete authorizedContracts[adr];
  }

  event RegisterAirline(
    address airline,  AirlineState as1,
    address reqBy, AirlineState as2
  );

  /**
  * @dev Initial funding for the insurance. Unless there are too many delayed
  *      flights resulting in insurance payouts, the contract should be
  *      self-sustaining
  */
  event Funded(address airline, uint256 value);
  function fund(address airline) isCallerAuthorized external payable
  {
    require(airlines[airline] != AirlineState.Funded,
      "Airline previously funded");
    require(airlines[airline] == AirlineState.Registered,
      "Airline not registered");
    airlines[airline] = AirlineState.Funded;
    emit Funded(airline, msg.value);
  }

  /**
  * @dev Add an airline to the registration queue
  *      Can only be called from FlightSuretyApp contract
  */
  function registerAirline(address airline, address requestedBy)
    external isCallerAuthorized requireIsOperational
  {

    require(airlines[requestedBy] == AirlineState.Funded,
      "only funded airlines may register a new airline");
    require(airlines[airline] != AirlineState.Registered,
      "Airline previously registered");
    require(airlines[airline] != AirlineState.Funded,
      "Airline previously registered and funed");

    airlines[airline] = AirlineState.Registered;

    emit RegisterAirline(
      airline,  airlines[airline],
      requestedBy, airlines[requestedBy]
    );
}

  event RegisteredFlight(address airline, string flight, uint256 timestamp);
  function registerFlight(address airline, string flight, uint256 timestamp)
    external isCallerAuthorized requireAirlineFunded(airline)
  {
    require(insuredFlight[flightKey].insured == false,
    "flight already insured");
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);
    insuredFlight[flightKey].insured = true;
    emit RegisteredFlight(airline, flight, timestamp);
  }


  /**
  * @dev Buy insurance for a flight
  */
  event Buy(address airline, string flight, uint256 timestamp,
    address passanger, uint256 amount);
  function buy(address airline, string flight, uint256 timestamp,
    address passanger)
      external payable requireAirlineFunded(airline)
  {
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);
    require(insuredFlight[flightKey].insured == true, "Flight not insured");
    bytes32 passangerKey = getPassangerKey(passanger, flightKey);
    require(insuredPassanger[passangerKey] != true,
      'Insurance previouly purchased for flight');
    insuredFlight[flightKey].passangers.push(Passanger(passanger, msg.value));
    insuredPassanger[passangerKey] = true;
    emit Buy(airline, flight, timestamp, passanger, msg.value);
  }

  /**
    *  @dev Credits payouts to insurees
  */
  event CreditInsuree(address airline, string flight, uint256 timestamp);
  function creditInsurees(address airline, string flight, uint256 timestamp)
    external requireAirlineFunded(airline)
  {
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);
    require (insuredFlight[flightKey].insured == true,
       "flight not insured");
    for (uint i=0; i < insuredFlight[flightKey].passangers.length; i++) {
      insurancePayout[insuredFlight[flightKey].passangers[i].adr] +=
        insuredFlight[flightKey].passangers[i].amount;
      bytes32 passangerKey = getPassangerKey(
        insuredFlight[flightKey].passangers[i].adr, flightKey);
      delete insuredPassanger[passangerKey];
      emit CreditInsuree(insuredFlight[flightKey].passangers[i].adr,
        flight, insuredFlight[flightKey].passangers[i].amount);
    }
    delete insuredFlight[flightKey];
  }

  /**
    *  @dev Clear payouts to insurees
  */
  event ClearInsurees(address airline, string flight, uint256 timestamp);
  function clearInsurees(address airline, string flight, uint256 timestamp)
    external requireAirlineFunded(airline)
  {
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);
    delete insuredFlight[flightKey];
    emit ClearInsurees(airline, flight, timestamp);
  }

  function passangerCredit(address passanger) external view
    returns (uint256 credit)
  {
    return insurancePayout[passanger];
  }
  /**
    *  @dev Transfers eligible payout funds to insuree
  */
  event Pay(address passanger, uint256 amount);
  function pay(uint256 n, uint256 d, address passanger) external
    payable requirePassangerFunded(passanger)
  {
    uint payout = insurancePayout[passanger].mul(n).div(d);
    delete insurancePayout[passanger];
    passanger.transfer(payout);
    emit Pay(passanger, payout);
  }

  /**
  * @dev Fallback function for funding smart contract.
  *
  */
  function() external payable
  {
  }
}

