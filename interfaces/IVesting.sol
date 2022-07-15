// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

interface IVesting {
    /**
     * @dev enum contain allocation type
     *
     * NOTE : use for calculate 'initialReward'
     */
    enum AllocationType {
        SEED,
        PRIVATE
    }

    event SetInitialTime(uint256 startDate);

    event AddInvestors(
        address[] investors,
        uint256[] balances,
        AllocationType[] allocation
    );

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
