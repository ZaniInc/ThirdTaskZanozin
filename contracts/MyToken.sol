// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    uint256 public vestingSupply = 100000_000000000000000000;
    constructor()ERC20("TOKEN","ERC") {
        _mint(msg.sender, vestingSupply);
    }
}
