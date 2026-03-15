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

    bytes32 public constant SWAP_SIG = keccak256("Swap(address,address,address,uint256,uint256)");
    bytes32 public constant MIRROR_CONTINUE_SIG = keccak256("MirrorContinue(address,address,address,uint256,uint256,uint256)");

    constructor(address _dex, address _leaderRegistry, address _followerVault, address _positionTracker, address _reputationEngine) {
        dex = ISimpleDEX(_dex);
        leaderRegistry = ILeaderRegistry(_leaderRegistry);
        followerVault = IFollowerVault(_followerVault);
        positionTracker = IPositionTracker(_positionTracker);
        reputationEngine = IReputationEngine(_reputationEngine);
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

            uint256 followerAmount = _calculateMirrorAmount(pos, leaderAmountIn);
            if (followerAmount == 0) continue;

            uint256 expectedOut = (leaderAmountOut * followerAmount) / leaderAmountIn;
            uint256 minOut = expectedOut * (10000 - pos.maxSlippageBps) / 10000;

            followerVault.pullTokens(followers[i], leader, tokenIn, followerAmount);
            IERC20(tokenIn).forceApprove(address(dex), followerAmount);

            try dex.swapFor(tokenIn, tokenOut, followerAmount, minOut, address(this), address(followerVault)) returns (uint256 actualOut) {
                positionTracker.updatePosition(followers[i], leader, tokenOut, actualOut, followerAmount);
                reputationEngine.recordTrade(leader, followerAmount);
                if (actualOut > expectedOut) {
                    uint256 profit = actualOut - expectedOut;
                    uint256 fee = profit * 5 / 100;
                    if (fee > 0) { followerVault.accrueFee(leader, fee); }
                }
                emit MirrorExecuted(followers[i], leader, tokenIn, tokenOut, followerAmount, actualOut);
            } catch {
                IERC20(tokenIn).safeTransfer(address(followerVault), followerAmount);
                emit MirrorFailed(followers[i], leader, tokenIn, tokenOut, followerAmount, "swap failed");
            }
        }

        uint256 nextOffset = offset + MAX_FOLLOWERS_PER_MIRROR;
        if (count == MAX_FOLLOWERS_PER_MIRROR && followerVault.getFollowerCount(leader) > nextOffset) {
            emit MirrorContinue(leader, tokenIn, tokenOut, leaderAmountIn, leaderAmountOut, nextOffset);
        }
    }

    function _calculateMirrorAmount(IFollowerVault.FollowPosition memory pos, uint256 leaderAmountIn) internal pure returns (uint256) {
        uint256 amount = leaderAmountIn;
        if (amount > pos.maxPerTrade) { amount = pos.maxPerTrade; }
        if (amount > pos.depositedSTT) { amount = pos.depositedSTT; }
        return amount;
    }
}
