// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interfaces/IMirrorExecutor.sol";
import "./interfaces/ISimpleDEX.sol";
import "./interfaces/ILeaderRegistry.sol";
import "./interfaces/IFollowerVault.sol";
import "./interfaces/IPositionTracker.sol";
import "./interfaces/IReputationEngine.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

contract MirrorExecutor is IMirrorExecutor, SomniaEventHandler, ReentrancyGuard {
    using SafeERC20 for IERC20;

    ISimpleDEX public immutable dex;
    ILeaderRegistry public immutable leaderRegistry;
    IFollowerVault public immutable followerVault;
    IPositionTracker public immutable positionTracker;
    IReputationEngine public immutable reputationEngine;

    uint256 public constant MAX_FOLLOWERS_PER_MIRROR = 5;
    uint256 public constant LEADER_FEE_BPS = 500; // 5%

    bytes32 public constant SWAP_SIG = keccak256("Swap(address,address,address,uint256,uint256)");
    bytes32 public constant MIRROR_CONTINUE_SIG = keccak256("MirrorContinue(address,address,address,uint256,uint256,uint256)");

    constructor(address _dex, address _leaderRegistry, address _followerVault, address _positionTracker, address _reputationEngine) {
        dex = ISimpleDEX(_dex);
        leaderRegistry = ILeaderRegistry(_leaderRegistry);
        followerVault = IFollowerVault(_followerVault);
        positionTracker = IPositionTracker(_positionTracker);
        reputationEngine = IReputationEngine(_reputationEngine);
    }

    /// @notice Manual trigger for mirror execution — fallback when reactive subscriptions aren't firing
    function triggerMirror(address leader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut) external nonReentrant {
        require(leaderRegistry.isLeader(leader), "Not a leader");
        _mirrorToFollowers(leader, tokenIn, tokenOut, amountIn, amountOut, 0);
    }

    function _onEvent(address, bytes32[] calldata topics, bytes calldata data) internal override nonReentrant {
        if (topics[0] == SWAP_SIG) {
            address leader = address(uint160(uint256(topics[1])));
            if (!leaderRegistry.isLeader(leader)) return;
            address tokenIn = address(uint160(uint256(topics[2])));
            address tokenOut = address(uint160(uint256(topics[3])));
            (uint256 amountIn, uint256 amountOut) = abi.decode(data, (uint256, uint256));
            _mirrorToFollowers(leader, tokenIn, tokenOut, amountIn, amountOut, 0);
        } else if (topics[0] == MIRROR_CONTINUE_SIG) {
            address leader = address(uint160(uint256(topics[1])));
            (address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 offset) = abi.decode(data, (address, address, uint256, uint256, uint256));
            _mirrorToFollowers(leader, tokenIn, tokenOut, amountIn, amountOut, offset);
        }
    }

    function _mirrorToFollowers(address leader, address tokenIn, address tokenOut, uint256 leaderAmountIn, uint256 leaderAmountOut, uint256 offset) internal {
        address[] memory followers = followerVault.getFollowers(leader, offset, MAX_FOLLOWERS_PER_MIRROR);
        uint256 count = followers.length;

        for (uint256 i = 0; i < count; i++) {
            IFollowerVault.FollowPosition memory pos = followerVault.getPosition(followers[i], leader);
            if (!pos.active) continue;

            uint256 followerBalance = followerVault.getTokenBalance(followers[i], leader, tokenIn);
            uint256 followerAmount = _calculateMirrorAmount(pos, leaderAmountIn, followerBalance);
            if (followerAmount == 0) continue;

            // 5% leader commission on trade amount (charged in input token)
            uint256 fee = followerAmount * LEADER_FEE_BPS / 10000;
            uint256 swapAmount = followerAmount - fee;

            // Use live pool price (not leader's pre-swap rate) to avoid slippage failures
            // Leader's swap already moved the price, so using leader's rate would always fail
            uint256 liveExpectedOut = dex.getAmountOut(tokenIn, tokenOut, swapAmount);
            uint256 minOut = liveExpectedOut * (10000 - pos.maxSlippageBps) / 10000;

            followerVault.pullTokens(followers[i], leader, tokenIn, swapAmount);
            if (fee > 0) { followerVault.accrueFee(followers[i], leader, tokenIn, fee); }
            IERC20(tokenIn).forceApprove(address(dex), swapAmount);

            try dex.swapFor(tokenIn, tokenOut, swapAmount, minOut, address(this), address(followerVault)) returns (uint256 actualOut) {
                followerVault.creditTokens(followers[i], leader, tokenOut, actualOut);
                positionTracker.updatePosition(followers[i], leader, tokenOut, actualOut, swapAmount);
                reputationEngine.recordTrade(leader, swapAmount);
                emit MirrorExecuted(followers[i], leader, tokenIn, tokenOut, swapAmount, actualOut);
            } catch {
                IERC20(tokenIn).safeTransfer(address(followerVault), swapAmount);
                followerVault.creditTokens(followers[i], leader, tokenIn, swapAmount);
                emit MirrorFailed(followers[i], leader, tokenIn, tokenOut, swapAmount, "swap failed");
            }
        }

        uint256 nextOffset = offset + MAX_FOLLOWERS_PER_MIRROR;
        if (count == MAX_FOLLOWERS_PER_MIRROR && followerVault.getFollowerCount(leader) > nextOffset) {
            emit MirrorContinue(leader, tokenIn, tokenOut, leaderAmountIn, leaderAmountOut, nextOffset);
        }
    }

    function _calculateMirrorAmount(IFollowerVault.FollowPosition memory pos, uint256 leaderAmountIn, uint256 followerBalance) internal pure returns (uint256) {
        uint256 amount = leaderAmountIn;
        if (amount > pos.maxPerTrade) { amount = pos.maxPerTrade; }
        if (amount > followerBalance) { amount = followerBalance; }
        return amount;
    }
}
