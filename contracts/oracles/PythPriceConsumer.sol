// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPythOracle.sol";

contract PythPriceConsumer is Ownable {
    IPythOracle public pythOracle;

    mapping(bytes32 => uint256) public priceFeeds;

    event PriceUpdated(bytes32 indexed priceId, int64 price, uint256 timestamp);

    constructor(address _pythOracle) Ownable(msg.sender) {
        pythOracle = IPythOracle(_pythOracle);
    }

    function updatePriceFeeds(bytes[] calldata priceUpdateData) external payable {
        uint256 fee = pythOracle.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient fee");

        pythOracle.updatePriceFeeds{value: fee}(priceUpdateData);

        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
    }

    function getPrice(
        bytes32 priceId,
        uint256 maxAge
    ) external view returns (int64 price, uint64 conf, uint256 publishTime) {
        IPythOracle.Price memory priceData = pythOracle.getPriceNoOlderThan(priceId, maxAge);

        return (priceData.price, priceData.conf, priceData.publishTime);
    }

    function setPythOracle(address _pythOracle) external onlyOwner {
        pythOracle = IPythOracle(_pythOracle);
    }

    function getUpdateFee(bytes[] calldata priceUpdateData) external view returns (uint256) {
        return pythOracle.getUpdateFee(priceUpdateData);
    }
}
