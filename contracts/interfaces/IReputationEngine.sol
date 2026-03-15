// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IReputationEngine {
    struct LeaderStats {
        uint256 totalTrades;
        uint256 profitableTrades;
        int256 totalPnlSTT;
        uint256 totalVolumeSTT;
        uint256 score;
        uint256 lastTradeBlock;
    }

    event ReputationUpdated(
        address indexed leader,
        uint256 totalTrades,
        uint256 winRate,
        int256 totalPnl,
        uint256 score
    );

    function recordTrade(address leader, uint256 volumeSTT) external;
    function recordClose(address leader, int256 realizedPnl) external;
    function getStats(address leader) external view returns (LeaderStats memory);
    function getScore(address leader) external view returns (uint256);
}
