// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interfaces/IFollowerVault.sol";
import "./interfaces/ILeaderRegistry.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FollowerVault is IFollowerVault, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    ILeaderRegistry public immutable leaderRegistry;
    IERC20 public immutable baseToken;

    mapping(address => mapping(address => FollowPosition)) public positions;
    mapping(address => address[]) public leaderFollowers;
    mapping(address => uint256) public totalFollowingSTT;

    // Multi-token balances: follower → leader → token → balance
    mapping(address => mapping(address => mapping(address => uint256))) public tokenBalances;

    // Leader fees per token: leader → token → amount
    mapping(address => mapping(address => uint256)) public pendingFees;

    address public mirrorExecutor;
    address public riskGuardian;

    modifier onlyMirrorExecutor() { require(msg.sender == mirrorExecutor, "Only MirrorExecutor"); _; }
    modifier onlyRiskGuardian() { require(msg.sender == riskGuardian, "Only RiskGuardian"); _; }

    constructor(address _leaderRegistry, address _baseToken) Ownable(msg.sender) {
        leaderRegistry = ILeaderRegistry(_leaderRegistry);
        baseToken = IERC20(_baseToken);
    }

    function setMirrorExecutor(address _mirrorExecutor) external onlyOwner { mirrorExecutor = _mirrorExecutor; }
    function setRiskGuardian(address _riskGuardian) external onlyOwner { riskGuardian = _riskGuardian; }

    function follow(address leader, uint256 amount, uint256 maxPerTrade, uint16 maxSlippageBps, uint256 stopLossSTT) external nonReentrant {
        require(amount > 0, "Must deposit STT");
        require(leaderRegistry.isLeader(leader), "Not a leader");
        require(!positions[msg.sender][leader].active, "Already following");
        require(maxPerTrade > 0, "Invalid maxPerTrade");
        require(maxSlippageBps > 0 && maxSlippageBps <= 10000, "Invalid slippage");
        require(stopLossSTT > 0, "Invalid stopLoss");
        baseToken.safeTransferFrom(msg.sender, address(this), amount);
        positions[msg.sender][leader] = FollowPosition({ follower: msg.sender, leader: leader, depositedSTT: amount, maxPerTrade: maxPerTrade, maxSlippageBps: maxSlippageBps, stopLossSTT: stopLossSTT, active: true });
        tokenBalances[msg.sender][leader][address(baseToken)] = amount;
        leaderFollowers[leader].push(msg.sender);
        totalFollowingSTT[leader] += amount;
        emit Followed(msg.sender, leader, amount, maxPerTrade);
    }

    function unfollow(address leader) external nonReentrant {
        FollowPosition storage pos = positions[msg.sender][leader];
        require(pos.active, "Not following");
        uint256 returnAmount = pos.depositedSTT;
        totalFollowingSTT[leader] -= returnAmount;
        pos.active = false; pos.depositedSTT = 0;
        tokenBalances[msg.sender][leader][address(baseToken)] = 0;
        address[] storage followers = leaderFollowers[leader];
        for (uint256 i = 0; i < followers.length; i++) { if (followers[i] == msg.sender) { followers[i] = followers[followers.length - 1]; followers.pop(); break; } }
        if (returnAmount > 0) { baseToken.safeTransfer(msg.sender, returnAmount); }
        emit Unfollowed(msg.sender, leader, returnAmount);
    }

    function deposit(address leader, uint256 amount) external nonReentrant {
        require(amount > 0, "Must deposit STT");
        FollowPosition storage pos = positions[msg.sender][leader];
        require(pos.active, "Not following");
        baseToken.safeTransferFrom(msg.sender, address(this), amount);
        pos.depositedSTT += amount;
        tokenBalances[msg.sender][leader][address(baseToken)] += amount;
        totalFollowingSTT[leader] += amount;
        emit Deposited(msg.sender, leader, amount);
    }

    function withdraw(address leader, uint256 amount) external nonReentrant {
        FollowPosition storage pos = positions[msg.sender][leader];
        require(pos.active, "Not following");
        require(tokenBalances[msg.sender][leader][address(baseToken)] >= amount, "Insufficient balance");
        pos.depositedSTT -= amount;
        tokenBalances[msg.sender][leader][address(baseToken)] -= amount;
        totalFollowingSTT[leader] -= amount;
        baseToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, leader, amount);
    }

    function getFollowers(address leader, uint256 offset, uint256 limit) external view returns (address[] memory) {
        address[] storage all = leaderFollowers[leader];
        if (offset >= all.length) { return new address[](0); }
        uint256 end = offset + limit; if (end > all.length) { end = all.length; }
        uint256 count = end - offset;
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) { result[i] = all[offset + i]; }
        return result;
    }

    function getFollowerCount(address leader) external view returns (uint256) { return leaderFollowers[leader].length; }
    function getPosition(address follower, address leader) external view returns (FollowPosition memory) { return positions[follower][leader]; }
    function getTokenBalance(address follower, address leader, address token) external view returns (uint256) { return tokenBalances[follower][leader][token]; }

    function pullTokens(address follower, address leader, address token, uint256 amount) external onlyMirrorExecutor {
        FollowPosition storage pos = positions[follower][leader];
        require(pos.active, "Not following");
        require(tokenBalances[follower][leader][token] >= amount, "Insufficient balance");
        tokenBalances[follower][leader][token] -= amount;
        if (token == address(baseToken)) {
            pos.depositedSTT -= amount;
            totalFollowingSTT[leader] -= amount;
        }
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function creditTokens(address follower, address leader, address token, uint256 amount) external onlyMirrorExecutor {
        tokenBalances[follower][leader][token] += amount;
        if (token == address(baseToken)) {
            positions[follower][leader].depositedSTT += amount;
            totalFollowingSTT[leader] += amount;
        }
    }

    function accrueFee(address follower, address leader, address token, uint256 amount) external onlyMirrorExecutor {
        require(tokenBalances[follower][leader][token] >= amount, "Insufficient for fee");
        tokenBalances[follower][leader][token] -= amount;
        if (token == address(baseToken)) {
            positions[follower][leader].depositedSTT -= amount;
            totalFollowingSTT[leader] -= amount;
        }
        pendingFees[leader][token] += amount;
    }

    function emergencyClose(address follower, address leader) external onlyRiskGuardian nonReentrant {
        FollowPosition storage pos = positions[follower][leader];
        require(pos.active, "Not following");
        uint256 returnAmount = pos.depositedSTT;
        totalFollowingSTT[leader] -= returnAmount;
        pos.active = false; pos.depositedSTT = 0;
        tokenBalances[follower][leader][address(baseToken)] = 0;
        address[] storage followers = leaderFollowers[leader];
        for (uint256 i = 0; i < followers.length; i++) { if (followers[i] == follower) { followers[i] = followers[followers.length - 1]; followers.pop(); break; } }
        if (returnAmount > 0) { baseToken.safeTransfer(follower, returnAmount); }
        emit EmergencyClosed(follower, leader, returnAmount, "stop-loss");
    }

    function claimFees(address token) external nonReentrant {
        require(leaderRegistry.isLeader(msg.sender), "Not a leader");
        uint256 amount = pendingFees[msg.sender][token];
        require(amount > 0, "No fees to claim");
        pendingFees[msg.sender][token] = 0;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit FeesClaimed(msg.sender, token, amount);
    }
}
