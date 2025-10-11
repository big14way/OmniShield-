// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title LPToken
/// @notice Liquidity Provider token for OmniShield Insurance Pool
/// @dev ERC20 token with permit functionality for gasless approvals
contract LPToken is ERC20, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Initializes the LP token contract
    /// @param _poolAddress Address of the insurance pool that can mint tokens
    constructor(
        address _poolAddress
    ) ERC20("OmniShield LP Token", "osLP") ERC20Permit("OmniShield LP Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _poolAddress);
    }

    /// @notice Mints LP tokens to a recipient
    /// @param to Recipient address
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Burns LP tokens from a holder
    /// @param from Holder address
    /// @param amount Amount of tokens to burn
    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
}
