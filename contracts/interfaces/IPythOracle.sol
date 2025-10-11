// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IPythOracle {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (Price memory);

    function updatePriceFeeds(bytes[] calldata priceUpdateData) external payable;

    function getUpdateFee(
        bytes[] calldata priceUpdateData
    ) external view returns (uint256 feeAmount);
}
