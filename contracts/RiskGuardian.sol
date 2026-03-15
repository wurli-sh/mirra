// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interfaces/IRiskGuardian.sol";
import "./interfaces/IFollowerVault.sol";
import "./interfaces/IPositionTracker.sol";
import "./interfaces/IReputationEngine.sol";
import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

contract RiskGuardian is IRiskGuardian, SomniaEventHandler {
    IFollowerVault public immutable vault;
    IPositionTracker public immutable tracker;
    IReputationEngine public immutable reputation;

    bytes32 public constant MIRROR_SIG = keccak256("MirrorExecuted(address,address,address,address,uint256,uint256)");

    constructor(address _vault, address _tracker, address _reputation) {
        vault = IFollowerVault(_vault);
        tracker = IPositionTracker(_tracker);
        reputation = IReputationEngine(_reputation);
    }

    function _onEvent(address, bytes32[] calldata topics, bytes calldata) internal override {
        if (topics[0] != MIRROR_SIG) return;
        address follower = address(uint160(uint256(topics[1])));
        address leader = address(uint160(uint256(topics[2])));
        IFollowerVault.FollowPosition memory pos = vault.getPosition(follower, leader);
        if (!pos.active) return;
        int256 unrealizedPnl = tracker.getUnrealizedPnl(follower, leader);
        if (unrealizedPnl < 0 && uint256(-unrealizedPnl) >= pos.stopLossSTT) {
            vault.emergencyClose(follower, leader);
            reputation.recordClose(leader, unrealizedPnl);
            emit PositionClosed(follower, leader, address(0), unrealizedPnl, "stop-loss");
        }
    }
}
