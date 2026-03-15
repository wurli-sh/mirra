// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IRiskGuardian {
    event PositionClosed(
        address indexed follower,
        address indexed leader,
        address token,
        int256 realizedPnl,
        string reason
    );
}
