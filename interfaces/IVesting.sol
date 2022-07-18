// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

interface IVesting {
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
     * @dev enum contain allocation type
     *
     * NOTE : use for calculate 'initialReward'
     */
    enum AllocationType {
        SEED,
        PRIVATE
    }

    /**
     * @dev event logs info about date when vesting is start
     *
     * @param startDate - time when vesting period is started
     */
    event SetInitialTime(uint256 startDate);

    /**
     * @dev event logs info about date when vesting is start
     *
     * @param investors - list of investors
     * @param balances - list of balances for investors
     * @param allocations - list of allocations types
     */
    event AddInvestors(
        address[] investors,
        uint256[] balances,
        AllocationType[] allocations
    );

    /**
     * @dev event logs info about withdraw transaction
     *
     * @param to - whos withdraw tokens
     * @param amountTokens - how many tokens will be withdraw
     */
    event Withdraw(address to, uint256 amountTokens);

    /**
     * @dev set time when Vesting period will start
     *
     * @param initialTimestamp_ - input time of last block
     * in seconds
     *
     * NOTE : function can call only owner of SC
     */
    function setInitialTimestamp(uint256 initialTimestamp_) external;

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
    ) external;

    /**
     * @dev function allow withdraw tokens for beneficiaries
     *
     * NOTE : function has no params take address from global
     * 'msg.sender'
     */
    function withdrawTokens() external;
}
