// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

interface IVesting {
    enum Allocation {
        Seed,
        Private
    }

    event VestingStart(uint256 startDate);

    event AddInvestors(address[] investors, uint256[] balances);

    event Withdraw(address to, uint256 amountTokens);

    function setInitialTimestamp(uint256 initialTimestamp_) external;

    function addInvestors(
        address[] calldata investors_,
        uint256[] calldata amount_,
        Allocation[] calldata allocation_
    ) external;

    function withdrawTokens() external;
}
