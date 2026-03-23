// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFollowerVault {
    struct FollowPosition {
        address follower;
        address leader;
        uint256 depositedSTT;
        uint256 maxPerTrade;
        uint16 maxSlippageBps;
        uint256 stopLossSTT;
        bool active;
    }

    event Followed(address indexed follower, address indexed leader, uint256 depositedSTT, uint256 maxPerTrade);
    event Unfollowed(address indexed follower, address indexed leader, uint256 returnedSTT);
    event Deposited(address indexed follower, address indexed leader, uint256 amount);
    event Withdrawn(address indexed follower, address indexed leader, uint256 amount);
    event EmergencyClosed(address indexed follower, address indexed leader, uint256 returnedSTT, string reason);
    event FeesClaimed(address indexed leader, address indexed token, uint256 amount);

    function baseToken() external view returns (IERC20);
    function follow(address leader, uint256 amount, uint256 maxPerTrade, uint16 maxSlippageBps, uint256 stopLossSTT) external;
    function unfollow(address leader) external;
    function deposit(address leader, uint256 amount) external;
    function withdraw(address leader, uint256 amount) external;
    function getFollowers(address leader, uint256 offset, uint256 limit) external view returns (address[] memory);
    function getFollowerCount(address leader) external view returns (uint256);
    function getPosition(address follower, address leader) external view returns (FollowPosition memory);
    function getTokenBalance(address follower, address leader, address token) external view returns (uint256);
    function pullTokens(address follower, address leader, address token, uint256 amount) external;
    function creditTokens(address follower, address leader, address token, uint256 amount) external;
    function accrueFee(address follower, address leader, address token, uint256 amount) external;
    function emergencyClose(address follower, address leader) external;
    function claimFees(address token) external;
}
