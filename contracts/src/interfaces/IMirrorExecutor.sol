// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IMirrorExecutor {
    event MirrorExecuted(
        address indexed follower,
        address indexed leader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event MirrorFailed(
        address indexed follower,
        address indexed leader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        string reason
    );
    function triggerMirror(address leader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut) external;
    event MirrorContinue(
        address indexed leader,
        address tokenIn,
        address tokenOut,
        uint256 leaderAmountIn,
        uint256 leaderAmountOut,
        uint256 nextOffset
    );
}
