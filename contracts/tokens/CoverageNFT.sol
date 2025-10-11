// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title CoverageNFT
/// @notice NFT representing insurance coverage in OmniShield protocol
/// @dev Each NFT represents a unique coverage policy
contract CoverageNFT is ERC721, ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct CoverageData {
        uint256 coverageAmount;
        uint256 premium;
        uint256 startTime;
        uint256 expiryTime;
        address asset;
        uint8 coverageType;
        bool active;
    }

    mapping(uint256 => CoverageData) public coverageData;

    /// @notice Emitted when a new coverage NFT is minted
    event CoverageMinted(
        uint256 indexed tokenId,
        address indexed holder,
        uint256 coverageAmount,
        uint256 expiryTime
    );

    /// @notice Emitted when coverage is claimed
    event CoverageClaimed(uint256 indexed tokenId, uint256 claimAmount);

    /// @notice Initializes the Coverage NFT contract
    /// @param _poolAddress Address of the insurance pool that can mint NFTs
    constructor(address _poolAddress) ERC721("OmniShield Coverage", "osCOV") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _poolAddress);
    }

    /// @notice Mints a new coverage NFT
    /// @param to Recipient address
    /// @param tokenId Unique token ID
    /// @param coverageAmount Amount of coverage
    /// @param premium Premium paid
    /// @param duration Duration of coverage in seconds
    /// @param asset Asset being covered
    /// @param coverageType Type of coverage
    function mint(
        address to,
        uint256 tokenId,
        uint256 coverageAmount,
        uint256 premium,
        uint256 duration,
        address asset,
        uint8 coverageType
    ) external onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);

        coverageData[tokenId] = CoverageData({
            coverageAmount: coverageAmount,
            premium: premium,
            startTime: block.timestamp,
            expiryTime: block.timestamp + duration,
            asset: asset,
            coverageType: coverageType,
            active: true
        });

        emit CoverageMinted(tokenId, to, coverageAmount, block.timestamp + duration);
    }

    /// @notice Deactivates coverage after claim
    /// @param tokenId Token ID to deactivate
    function deactivateCoverage(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        coverageData[tokenId].active = false;
        emit CoverageClaimed(tokenId, coverageData[tokenId].coverageAmount);
    }

    /// @notice Checks if coverage is active and valid
    /// @param tokenId Token ID to check
    /// @return bool True if coverage is active and not expired
    function isValidCoverage(uint256 tokenId) external view returns (bool) {
        CoverageData memory data = coverageData[tokenId];
        return data.active && block.timestamp <= data.expiryTime;
    }

    /// @dev Override required by Solidity for multiple inheritance
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /// @dev Override required by Solidity for multiple inheritance
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
