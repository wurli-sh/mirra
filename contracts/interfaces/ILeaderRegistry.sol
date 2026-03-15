// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface ILeaderRegistry {
    struct Leader {
        address addr;
        uint256 stakedSTT;
        uint256 registeredAt;
        bool active;
    }

    event LeaderRegistered(address indexed leader, uint256 stakedSTT);
    event LeaderDeregistered(address indexed leader, uint256 returnedSTT);

    function registerLeader() external payable;
    function deregisterLeader() external;
    function isLeader(address addr) external view returns (bool);
    function getLeaderCount() external view returns (uint256);
    function getLeaderAt(uint256 index) external view returns (address);
}
