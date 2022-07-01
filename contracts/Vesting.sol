// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/IVesting.sol";

contract Vesting is IVesting, Ownable {
    using SafeERC20 for IERC20;

    struct Beneficiary {
        uint256 intialReward;
        uint256 rewardPaid;
        uint256 balanceBase;
    }

    mapping(address => Beneficiary) public listOfBeneficiaries;
    mapping(Allocation => mapping(address => Beneficiary))
        public allocationList;
    uint256 public vestingStartDate;
    uint256 public vestingDuration;
    uint256 public vestingCliff;

    IERC20 private _token;

    constructor(address token_) {
        require(
            Address.isContract(token_),
            "Error : Incorrect address , only contract address"
        );
        _token = IERC20(token_);
    }

    function setInitialTimestamp(uint256 initialTimestamp_)
        external
        override
        onlyOwner
    {
        require(
            initialTimestamp_ != 0,
            "Error : 'initialTimestamp_' must be greater than 0"
        );
        require(vestingStartDate == 0, "error : can call only once time");
        vestingStartDate = block.timestamp + initialTimestamp_;
        vestingCliff = vestingStartDate + 10 minutes;
        vestingDuration = vestingCliff + 600 minutes;
        emit VestingStart(vestingStartDate);
    }

    function addInvestors(
        address[] calldata investors_,
        uint256[] calldata amount_,
        Allocation[] calldata allocation_
    ) external override onlyOwner {
        require(
            investors_.length == amount_.length &&
                investors_.length == allocation_.length,
            "Error : Different arrays length"
        );
        uint256 sumOfAmount;
        for (uint256 i; i < investors_.length; i++) {
            require(
                investors_[i] > address(0) && amount_[i] > 0,
                "Error : 'investors_' or 'amount_' , equal to 0"
            );
            if (allocation_[i] == Allocation.Seed) {
                allocationList[allocation_[i]][
                    investors_[i]
                ] = listOfBeneficiaries[investors_[i]];
                listOfBeneficiaries[investors_[i]].intialReward += ((amount_[
                    i
                ] / 10000) * 1000);
                listOfBeneficiaries[investors_[i]].balanceBase += amount_[i];
            }
            if (allocation_[i] == Allocation.Private) {
                allocationList[allocation_[i]][
                    investors_[i]
                ] = listOfBeneficiaries[investors_[i]];
                listOfBeneficiaries[investors_[i]].intialReward += ((amount_[
                    i
                ] / 10000) * 1500);
                listOfBeneficiaries[investors_[i]].balanceBase += amount_[i];
            }
            sumOfAmount += amount_[i];
        }
        _token.safeTransferFrom(msg.sender, address(this), sumOfAmount);
        emit AddInvestors(investors_, amount_);
    }

    function withdrawTokens() external override {
        require(vestingStartDate > 0, "Error : first set 'vestingStartDate'");
        require(
            vestingCliff < block.timestamp,
            "Error : wait until cliff period is end"
        );
        require(
            listOfBeneficiaries[msg.sender].balanceBase > 0,
            "Error : not enougth tokens"
        );
        require(
            listOfBeneficiaries[msg.sender].rewardPaid <
                listOfBeneficiaries[msg.sender].balanceBase,
            "Error : not enougth tokens"
        );
        uint256 amount = listOfBeneficiaries[msg.sender].intialReward +
            (_calculateUnlock(100));
        require(amount > 0, "Error : 'amount' equal to 0");
        listOfBeneficiaries[msg.sender].intialReward = 0;
        listOfBeneficiaries[msg.sender].rewardPaid += amount;
        _token.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function _calculateUnlock(uint256 percent) internal view returns (uint256) {
        uint256 onePercentInTokens = (listOfBeneficiaries[msg.sender]
            .balanceBase / 10000) * percent;
        if (block.timestamp < vestingDuration) {
            uint256 actualTime = (block.timestamp - vestingCliff) / 6 minutes;
            return
                (actualTime * onePercentInTokens) -
                listOfBeneficiaries[msg.sender].rewardPaid;
        } else if (block.timestamp > vestingDuration) {
            return
                (onePercentInTokens * 100) -
                listOfBeneficiaries[msg.sender].rewardPaid;
        }
    }
}
