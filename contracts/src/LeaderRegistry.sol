// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interfaces/ILeaderRegistry.sol";

contract LeaderRegistry is ILeaderRegistry {
    mapping(address => Leader) public leaders;
    address[] public leaderList;

    uint256 public constant MIN_LEADER_STAKE = 10 ether;

    function registerLeader() external payable {
        require(msg.value >= MIN_LEADER_STAKE, "Insufficient stake");
        require(!leaders[msg.sender].active, "Already registered");

        leaders[msg.sender] = Leader({ addr: msg.sender, stakedSTT: msg.value, registeredAt: block.timestamp, active: true });
        leaderList.push(msg.sender);
        emit LeaderRegistered(msg.sender, msg.value);
    }

    function deregisterLeader() external {
        Leader storage leader = leaders[msg.sender];
        require(leader.active, "Not a leader");
        uint256 stake = leader.stakedSTT;
        leader.active = false;
        leader.stakedSTT = 0;
        for (uint256 i = 0; i < leaderList.length; i++) {
            if (leaderList[i] == msg.sender) { leaderList[i] = leaderList[leaderList.length - 1]; leaderList.pop(); break; }
        }
        (bool sent, ) = payable(msg.sender).call{value: stake}("");
        require(sent, "Transfer failed");
        emit LeaderDeregistered(msg.sender, stake);
    }

    function isLeader(address addr) external view returns (bool) { return leaders[addr].active; }
    function getLeaderCount() external view returns (uint256) { return leaderList.length; }
    function getLeaderAt(uint256 index) external view returns (address) { require(index < leaderList.length, "Index out of bounds"); return leaderList[index]; }
}
