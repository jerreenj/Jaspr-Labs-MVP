// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {
    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        // Anyone can mint for testing
        _mint(to, amount);
    }

    function faucet() external {
        // Auto-mint 100 USDC to caller
        _mint(msg.sender, 100 * 10**6);
    }
}