// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title PythPriceFeeds
/// @notice Pyth Network price feed IDs for different networks
/// @dev Reference: https://pyth.network/developers/price-feed-ids
library PythPriceFeeds {
    // ============ Pyth Contract Addresses ============

    /// @notice Pyth contract on Ethereum Sepolia testnet
    address public constant PYTH_SEPOLIA = 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21;

    /// @notice Pyth contract on Polygon Amoy testnet
    address public constant PYTH_POLYGON_AMOY = 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729;

    /// @notice Pyth contract on Hedera testnet
    address public constant PYTH_HEDERA_TESTNET = 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729;

    /// @notice Pyth contract on Ethereum mainnet
    address public constant PYTH_MAINNET = 0x4305FB66699C3B2702D4d05CF36551390A4c69C6;

    /// @notice Pyth contract on Polygon mainnet
    address public constant PYTH_POLYGON = 0xff1a0f4744e8582DF1aE09D5611b887B6a12925C;

    // ============ Major Crypto Assets ============

    /// @notice BTC/USD price feed
    bytes32 public constant BTC_USD =
        0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;

    /// @notice ETH/USD price feed
    bytes32 public constant ETH_USD =
        0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    /// @notice USDC/USD price feed
    bytes32 public constant USDC_USD =
        0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a;

    /// @notice USDT/USD price feed
    bytes32 public constant USDT_USD =
        0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b;

    /// @notice DAI/USD price feed
    bytes32 public constant DAI_USD =
        0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd;

    /// @notice MATIC/USD price feed
    bytes32 public constant MATIC_USD =
        0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52;

    /// @notice HBAR/USD price feed
    bytes32 public constant HBAR_USD =
        0x5c6c0d2386e3352356c3ab84434fafb5ea067ac2678a38a338c4a69ddc4bdb0c;

    // ============ DeFi Tokens ============

    /// @notice LINK/USD price feed
    bytes32 public constant LINK_USD =
        0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221;

    /// @notice UNI/USD price feed
    bytes32 public constant UNI_USD =
        0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501;

    /// @notice AAVE/USD price feed
    bytes32 public constant AAVE_USD =
        0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445;

    /// @notice CRV/USD price feed
    bytes32 public constant CRV_USD =
        0xa19d04ac696c7a6616d291c7e5d1377cc8be437c327b75adb5dc1bad745fcae8;

    /// @notice MKR/USD price feed
    bytes32 public constant MKR_USD =
        0x9375299e31c0deb9c6bc378e6329aab44cb48ec655552a70d4b9050346a30378;

    // ============ Stablecoins ============

    /// @notice BUSD/USD price feed
    bytes32 public constant BUSD_USD =
        0x5bc91f13e412c07599167bae86f07543f076a638962b8d6017ec19dab4a82814;

    /// @notice FRAX/USD price feed
    bytes32 public constant FRAX_USD =
        0x5b1703d7eb9dc0ae5e2e09d3f0b0d3d8e0d1e4e1c2b3a4f5e6d7c8b9a0b1c2d3;

    /// @notice TUSD/USD price feed
    bytes32 public constant TUSD_USD =
        0x5b1703d7eb9dc0ae5e2e09d3f0b0d3d8e0d1e4e1c2b3a4f5e6d7c8b9a0b1c2d4;

    // ============ Helper Functions ============

    /// @notice Get Pyth contract address for network
    /// @param chainId Chain ID
    /// @return pythAddress Pyth contract address
    function getPythAddress(uint256 chainId) internal pure returns (address pythAddress) {
        if (chainId == 1) return PYTH_MAINNET; // Ethereum mainnet
        if (chainId == 11155111) return PYTH_SEPOLIA; // Sepolia
        if (chainId == 137) return PYTH_POLYGON; // Polygon
        if (chainId == 80002) return PYTH_POLYGON_AMOY; // Polygon Amoy
        if (chainId == 296) return PYTH_HEDERA_TESTNET; // Hedera testnet
        revert("Unsupported chain");
    }

    /// @notice Get price feed ID for common assets
    /// @param symbol Asset symbol
    /// @return feedId Price feed ID
    function getPriceFeedId(string memory symbol) internal pure returns (bytes32 feedId) {
        bytes32 symbolHash = keccak256(abi.encodePacked(symbol));

        if (symbolHash == keccak256("BTC")) return BTC_USD;
        if (symbolHash == keccak256("ETH")) return ETH_USD;
        if (symbolHash == keccak256("USDC")) return USDC_USD;
        if (symbolHash == keccak256("USDT")) return USDT_USD;
        if (symbolHash == keccak256("DAI")) return DAI_USD;
        if (symbolHash == keccak256("MATIC")) return MATIC_USD;
        if (symbolHash == keccak256("HBAR")) return HBAR_USD;
        if (symbolHash == keccak256("LINK")) return LINK_USD;
        if (symbolHash == keccak256("UNI")) return UNI_USD;
        if (symbolHash == keccak256("AAVE")) return AAVE_USD;
        if (symbolHash == keccak256("CRV")) return CRV_USD;
        if (symbolHash == keccak256("MKR")) return MKR_USD;
        if (symbolHash == keccak256("BUSD")) return BUSD_USD;
        if (symbolHash == keccak256("FRAX")) return FRAX_USD;
        if (symbolHash == keccak256("TUSD")) return TUSD_USD;

        revert("Unknown asset symbol");
    }

    /// @notice Check if price feed is supported
    /// @param feedId Price feed ID
    /// @return supported True if supported
    function isSupportedFeed(bytes32 feedId) internal pure returns (bool supported) {
        return
            feedId == BTC_USD ||
            feedId == ETH_USD ||
            feedId == USDC_USD ||
            feedId == USDT_USD ||
            feedId == DAI_USD ||
            feedId == MATIC_USD ||
            feedId == HBAR_USD ||
            feedId == LINK_USD ||
            feedId == UNI_USD ||
            feedId == AAVE_USD ||
            feedId == CRV_USD ||
            feedId == MKR_USD ||
            feedId == BUSD_USD ||
            feedId == FRAX_USD ||
            feedId == TUSD_USD;
    }
}
