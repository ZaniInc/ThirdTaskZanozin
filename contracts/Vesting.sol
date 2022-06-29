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
    mapping(address => uint256) public balance;
    uint256 public seedWallet;
    uint256 public privateWallet;
    uint256 public vestedAmount;
    address public owner;
    uint256 public vestingStartDate;
    uint256 public vestingDuration;
    uint256 public vestingCliff;
    uint256 reward;

    IERC20 private _token;
    uint256 nonce;

    constructor(address token_, uint256 amount_) {
        _token = IERC20(token_);
        owner = msg.sender;
        vestedAmount = amount_;
        seedWallet = (owner.balance() / 10000) * 1000;
        privateWallet = (owner.balance() / 10000) * 1500;
        vestingCliff = initialTimeVesting + 10 minutes;
        vestingDuration = initialTimeVesting + 600 minutes;
    }

    modifier onlyOwner() {
        require(owner == msg.sender);
        _;
    }

    modifier onlyOnce() {
        require(nonce == 0);
        _;
    }

    modifier unlockTimer() {
        if(block.timestamp < vestingDuration){
            uint256 unlockTimes = 6 minutes;
            uint256 actualTime = (block.timestamp - vestingStartDate) / unlockTimes;
            reward = actualTime;
        _;
        }
        else if (block.timestamp > vestingDuration){
            reward = 100;
            _;
        }
    }

    function setInitialTimestamp(uint256 initialTimestamp_)
        external
        override
        onlyOwner
        onlyOnce
    {
        nonce++;
        vestingStartDate = block.timestamp + initialTimestamp_;
    }

    function addInvestors(
        address[] calldata investors_,
        uint256[] calldata amount_,
        IVesting.Allocation[] calldata allocation_
    ) external override onlyOwner {
        uint256 sumOfAmount;
        for (uint256 i; i < investors_.length; i++) {
            require(investors_[i] > address(0) && amount_[i] > 0);
            listOfBeneficiaries[investors_[i]].investor = investors_[i];
            listOfBeneficiaries[investors_[i]].location = allocation_[i];
            listOfBeneficiaries[investors_[i]].balance += amount_[i];
            balance[investors_[i]] += amount_[i];
            sumOfAmount += amount_[i];
        }
        _token.transferFrom(msg.sender, address(this), sumOfAmount);
    }

    function withdrawTokens() external override {
        require(vestingStartDate > 0);
        require(vestingCliff < block.timestamp);
        address caller = msg.sender;
        require(listOfBeneficiaries[caller].balance > 0);
        require(balance[caller] > 0);
        if (
            listOfBeneficiaries[caller].location == IVesting.Allocation.Seed
        ) {
            uint256 amount = (balance[caller]/ 10000) * 1000;
            listOfBeneficiaries[caller].balance -= amount;
            _token.transfer(caller, amount);
        }
        else if (
            listOfBeneficiaries[caller].location == IVesting.Allocation.Private
        ) {
            uint256 amount = (balance[caller]/ 10000) * 1500;
            listOfBeneficiaries[caller].balance -= amount;
            _token.transfer(caller, amount);
        }
    }

    function calculatePercent() internal returns (uint256) {
        return (balance[msg.sender] / 10000) * 100;
    }

    function claimTokens() external unlockTimer {
        require(vestingCliff < block.timestamp);
        uint256 collectTokens = reward * calculatePercent();
        address caller = msg.sender;
        listOfBeneficiaries[caller].balance -= collectTokens;
        _token.transfer(caller, collectTokens);
    }
}
