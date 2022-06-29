// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    totalSupply = 100000_000000000000000000
    constructor()ERC20("TOKEN","ERC") {
        _mint(msg.sender, 100000_000000000000000000);
    }
}
