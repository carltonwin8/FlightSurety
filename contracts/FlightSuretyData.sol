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
  mapping(bytes32 => address[]) insuredFlight;
  mapping(bytes32 => uint256) insuredPassanger;
  mapping(address => uint256) insurancePayout;
  /*************************************************************************/
  /*                                       EVENT DEFINITIONS                /
  /*************************************************************************/
  event RegisterAirlineD(
    address arline1,  AirlineState as1,
    address arline2, AirlineState as2,
    address arline3, AirlineState as3
  ); 

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
  modifier requireBuyLimit()
  {
    require(msg.value <= 1, "Insurance purchase has to be 1 ether or less");
    _;
  }
  modifier requireAirlineFunded(address adr)
  {
    require(airlines[adr] == AirlineState.Funded, 
      "Airline not registered or not funded");
    _;
  } 
  modifier requirePassangerFunded()
  {
    require(insurancePayout[msg.sender] != 0 , 
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

  /**
  * @dev Sets contract operations on/off
  * When operational mode is disabled, all write transactions except for this
  * one will fail
  */    
  function setOperatingStatus(bool mode) external requireContractOwner 
  {
    operational = mode;
  }

  function isAirline(address airline) public view requireContractOwner returns(bool)
  {
    if (airlines[airline] == AirlineState.Unregistered) return false;
    return true;
  }


  function airlineStatus(address airline) public view requireContractOwner returns(AirlineState)
  {
    return airlines[airline];
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

    emit RegisterAirlineD(
      requestedBy, airlines[requestedBy],
      airline,  airlines[airline],
      address(0),  airlines[address(0)]
    );
}

  function registerFlight(address airline, string flight, uint256 timestamp) external isCallerAuthorized
  {
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);
    address[] memory adr;
    insuredFlight[flightKey] = adr;
  }


  /**
  * @dev Buy insurance for a flight
  */   
  function buy(address airline, string flight, uint256 timestamp)
      external payable requireBuyLimit() requireAirlineFunded(airline)
  {
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);
    bytes32 passangerKey = getPassangerKey(msg.sender, flightKey);
    require(insuredPassanger[passangerKey] == 0, 'Insurance previouly purchased');
    insuredFlight[flightKey].push(msg.sender) ;
    insuredPassanger[passangerKey] = msg.value;
  }

  /**
    *  @dev Credits payouts to insurees
  */
  function creditInsurees(address airline, string flight, uint256 timestamp) external 
  requireAirlineFunded(airline)
  {
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);
    require (insuredFlight[flightKey].length >= 0, "passanger not insured");
    address[] memory passangers = insuredFlight[flightKey];
    for (uint i; i < passangers.length; i++) {
      address passanger = passangers[i];
      bytes32 passangerKey = getPassangerKey(passanger, flightKey);
      insurancePayout[passanger].add(insuredPassanger[passangerKey]);
    }
    delete insuredFlight[flightKey];
  }

  /**
    *  @dev Clear payouts to insurees
  */
  function clearInsurees(address airline, string flight, uint256 timestamp) external 
  requireAirlineFunded(airline)
  {
    bytes32 flightKey = getFlightKey(airline, flight, timestamp);
    delete insuredFlight[flightKey];
  }

  /**
    *  @dev Transfers eligible payout funds to insuree
  */
  function pay(uint256 n, uint256 d) external payable requirePassangerFunded()
  {
    uint payout = insurancePayout[msg.sender].mul(n).div(d);
    delete insurancePayout[msg.sender];
    contractOwner.transfer(payout);
  }

  /**
  * @dev Initial funding for the insurance. Unless there are too many delayed
  *      flights resulting in insurance payouts, the contract should be
  *      self-sustaining
  */   
  function fund(address airline) external payable
  {
    require(msg.value == 10 ether, "Airline insufficently funded");
    require(airlines[airline] == AirlineState.Registered,
      "Airline not registered");
    airlines[airline] = AirlineState.Funded;
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
  
  /**
  * @dev Fallback function for funding smart contract.
  *
  */
  function() external payable 
  {
  }
}

