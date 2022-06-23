// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";    
import "../interfaces/IVesting.sol";

contract Vesting is IVesting {

    struct Beneficiary {
        address investor;
        uint256 balance;
        IVesting.Allocation location;
    }

    mapping(address => Beneficiary) public listOfBeneficiaries;
    uint256 public vestedAmount;
    address public owner;
    uint256 public vestingStartDate;
    uint256 public vestingDuration = 600 minutes;
    uint256 public vestingCliff = 10 minutes;

    IERC20 private _token;
    uint256 nonce;


    constructor(address token_ , uint256 amount_){
        _token = IERC20(token_);
        owner = msg.sender;
        vestedAmount = amount_;
    }

    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    modifier onlyOnce {
        require(nonce == 1);
        _;
    }

    function setInitialTimestamp (uint256 initialTimestamp_) external override onlyOwner onlyOnce{
        nonce++;
        vestingStartDate = block.timestamp + initialTimestamp_;
    }

    function addInvestors (
    address[]calldata investors_,
    uint256[] calldata amount_,
    IVesting.Allocation [] calldata allocation_
    ) external override onlyOwner onlyOnce{
        uint256 sumOfAmount;
        for(uint i;i<investors_.length;i++){
            listOfBeneficiaries[investors_[i]].investor = investors_[i];
            listOfBeneficiaries[investors_[i]].location = allocation_[i];
            listOfBeneficiaries[investors_[i]].balance += amount_[i];
            sumOfAmount += amount_[i];
        }
        _token.transferFrom(msg.sender,address(this),sumOfAmount);
    }

    function withdrawTokens () external override onlyOwner onlyOnce{
        require(vestingStartDate > 0);
        require(listOfBeneficiaries[msg.sender].balance > 0);
        uint256 amount = listOfBeneficiaries[msg.sender].balance;
        listOfBeneficiaries[msg.sender].balance = 0;
        _token.transfer(msg.sender , amount);
    }

}
