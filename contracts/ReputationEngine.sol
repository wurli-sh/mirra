// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interfaces/IReputationEngine.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationEngine is IReputationEngine, Ownable {
    mapping(address => LeaderStats) public stats;
    mapping(address => bool) public authorized;

    modifier onlyAuthorized() { require(authorized[msg.sender], "Not authorized"); _; }

    constructor() Ownable(msg.sender) {}

    function setAuthorized(address addr, bool isAuthorized) external onlyOwner { authorized[addr] = isAuthorized; }

    function recordTrade(address leader, uint256 volumeSTT) external onlyAuthorized {
        LeaderStats storage s = stats[leader];
        s.totalTrades++; s.totalVolumeSTT += volumeSTT; s.lastTradeBlock = block.number;
        _recalcScore(leader);
        uint256 winRate = s.totalTrades > 0 ? (s.profitableTrades * 100) / s.totalTrades : 0;
        emit ReputationUpdated(leader, s.totalTrades, winRate, s.totalPnlSTT, s.score);
    }

    function recordClose(address leader, int256 pnl) external onlyAuthorized {
        LeaderStats storage s = stats[leader];
        s.totalPnlSTT += pnl;
        if (pnl > 0) { s.profitableTrades++; }
        _recalcScore(leader);
        uint256 winRate = s.totalTrades > 0 ? (s.profitableTrades * 100) / s.totalTrades : 0;
        emit ReputationUpdated(leader, s.totalTrades, winRate, s.totalPnlSTT, s.score);
    }

    function getStats(address leader) external view returns (LeaderStats memory) { return stats[leader]; }
    function getScore(address leader) external view returns (uint256) { return stats[leader].score; }

    function _recalcScore(address leader) internal {
        LeaderStats storage s = stats[leader];
        uint256 winRate = s.totalTrades > 0 ? (s.profitableTrades * 100) / s.totalTrades : 0;
        uint256 volumeNorm = s.totalVolumeSTT > 1000 ether ? 100 : (s.totalVolumeSTT * 100) / 1000 ether;
        uint256 recency = block.number - s.lastTradeBlock < 1000 ? 100 : 50;
        s.score = (winRate * 60 + volumeNorm * 20 + recency * 20) / 100;
    }
}
