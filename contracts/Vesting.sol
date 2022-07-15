// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/IVesting.sol";

/**
 * @title Vesting
 * @author ZaniInc
 * @notice This SC for unlock tokens after presale
 * on Seed and Private rounds
 */
contract Vesting is IVesting, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;

    /**
     * @dev Store info about beneficiaries
     * @param initialReward - set how many tokens available to
     * beneficiary for only once withdraw
     * @param rewardPaid - update every time when call 'withdraw'
     * @param balanceBase - total amount of tokens which will be available
     * for beneficiary
     * @param allocationType - contain in which round beneficiary invested
     */
    struct Beneficiary {
        uint256 initialReward;
        uint256 rewardPaid;
        uint256 balanceBase;
        AllocationType allocationType;
    }

    /**
     * @dev this mean 100% of tokens amount
     * @notice using to find percentage of the number
     */
    uint256 public constant MAX_PERCENTAGE = 10000;
    /**
     * @dev how many tokens will unlock after 6 minutes
     * @notice every 6 minutes unlock 1% of total amount
     */
    uint256 public constant MAX_UNLOCK_AMOUNT = 100;

    /**
     * @dev mapping store all beneficiaries
     */
    mapping(address => Beneficiary) public listOfBeneficiaries;

    /**
     * @dev contain time when call function 'setInitialTimestamp'
     * @notice take time from last block
     */
    uint256 public vestingStartDate;

    /**
     * @dev how long is the vesting period
     * @notice when vestingDuration will be < than current time
     * user will have access for all tokens
     */
    uint256 public vestingDuration;

    /**
     * @dev how long is the cliff period
     * @notice when vestingCliff > than current time
     * user can't withdraw any tokens
     */
    uint256 public vestingCliff;

    /**
     * @dev mapping store percentage how many tokens
     * will open like initialReward
     */
    mapping(AllocationType => uint256) private _initialPercentage;

    IERC20 private _token;

    /**
     * @dev Set '_token' IERC20 to interact with thrid party token
     *
     * @param token_ - of ERC20 contract
     * @notice set percentage for AllocationTypes
     */
    constructor(address token_) {
        require(
            Address.isContract(token_),
            "Error : Incorrect address , only contract address"
        );
        _token = IERC20(token_);
        _initialPercentage[AllocationType.SEED] = 1000;
        _initialPercentage[AllocationType.PRIVATE] = 1500;
    }

    /**
     * @dev set time when Vesting period will start
     *
     * @param initialTimestamp_ - input time of last block
     * in seconds
     *
     * NOTE : function can call only owner of SC
     */
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
        vestingStartDate = initialTimestamp_;
        vestingCliff = vestingStartDate + 10 minutes;
        vestingDuration = vestingCliff + 600 minutes;
        emit SetInitialTime(vestingStartDate);
    }

    /**
     * @dev function set investors param
     *
     * @param investors_ - contain list of investors address
     * @param amounts_ - contain how many tokens investor must claim
     * @param allocations_ - contain in which round investor buy tokens
     *
     * NOTE : function can call only owner of SC , transfer sum of 'amounts_'
     * to this contract address
     */
    function addInvestors(
        address[] calldata investors_,
        uint256[] calldata amounts_,
        AllocationType[] calldata allocations_
    ) external override onlyOwner {
        require(
            investors_.length == amounts_.length &&
                investors_.length == allocations_.length,
            "Error : Different arrays length"
        );
        uint256 sumOfAmount;
        for (uint256 i; i < investors_.length; i++) {
            require(
                investors_[i] > address(0) && amounts_[i] > 0,
                "Error : 'investors_' or 'amount_' , equal to 0"
            );
            listOfBeneficiaries[investors_[i]].allocationType = allocations_[i];
            listOfBeneficiaries[investors_[i]].balanceBase += amounts_[i];
            listOfBeneficiaries[investors_[i]].initialReward +=
                (amounts_[i] / MAX_PERCENTAGE) *
                _initialPercentage[allocations_[i]];
            sumOfAmount += amounts_[i];
        }
        _token.safeTransferFrom(msg.sender, address(this), sumOfAmount);
        emit AddInvestors(investors_, amounts_, allocations_);
    }

    /**
     * @dev function allow withdraw tokens for beneficiaries
     *
     * NOTE : function has no params take address from global
     * 'msg.sender'
     */
    function withdrawTokens() external override {
        require(
            vestingStartDate > 0,
            "Error : first call 'setInitialTimestamp'"
        );
        require(
            block.timestamp > vestingCliff,
            "Error : wait until cliff period is end"
        );
        require(
            listOfBeneficiaries[msg.sender].balanceBase >
                listOfBeneficiaries[msg.sender].rewardPaid,
            "Error : No available tokens to withdraw"
        );
        uint256 amount = _calculateUnlock(MAX_UNLOCK_AMOUNT);
        require(amount > 0, "Error : 'amount' equal to 0");
        listOfBeneficiaries[msg.sender].rewardPaid += amount;
        listOfBeneficiaries[msg.sender].initialReward = 0;
        _token.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @dev internal function for calculate how many tokens
     * beneficiary can take when call function withdraw
     */
    function _calculateUnlock(uint256 percentage)
        internal
        view
        returns (uint256)
    {
        uint256 onePercentInTokens = (listOfBeneficiaries[msg.sender]
            .balanceBase / MAX_PERCENTAGE) * percentage;
        if (block.timestamp < vestingDuration) {
            uint256 passedPeriods = (block.timestamp - vestingCliff) /
                6 minutes;
            return
                ((passedPeriods * onePercentInTokens) +
                    listOfBeneficiaries[msg.sender].initialReward) -
                listOfBeneficiaries[msg.sender].rewardPaid;
        } else if (block.timestamp > vestingDuration) {
            return
                (onePercentInTokens * 100) -
                listOfBeneficiaries[msg.sender].rewardPaid;
        }
    }
}
