// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IPositionTracker {
    struct Position {
        address token;
        uint256 entryAmount;
        uint256 totalCostSTT;
        uint256 avgEntryPrice;
    }

    event PositionUpdated(
        address indexed follower,
        address indexed leader,
        address token,
        uint256 exposure,
        int256 unrealizedPnl
    );

    function updatePosition(address follower, address leader, address token, uint256 amount, uint256 cost) external;
    function closePosition(address follower, address leader, address token, int256 realizedPnl) external;
    function getPosition(address follower, address leader, address token) external view returns (Position memory);
    function getUnrealizedPnl(address follower, address leader) external view returns (int256);
    function getActiveTokens(address follower, address leader) external view returns (address[] memory);
}
