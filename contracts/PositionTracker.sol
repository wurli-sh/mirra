// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interfaces/IPositionTracker.sol";
import "./interfaces/ISimpleDEX.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PositionTracker is IPositionTracker, Ownable {
    mapping(address => mapping(address => mapping(address => Position))) public positions;
    mapping(address => mapping(address => int256)) public realizedPnl;
    mapping(address => mapping(address => address[])) private _activeTokens;
    mapping(address => mapping(address => mapping(address => bool))) private _hasActiveToken;
    mapping(address => bool) public authorized;

    ISimpleDEX public dex;
    address public baseToken;

    modifier onlyAuthorized() { require(authorized[msg.sender], "Not authorized"); _; }

    constructor(address _dex, address _baseToken) Ownable(msg.sender) {
        dex = ISimpleDEX(_dex);
        baseToken = _baseToken;
    }

    function setAuthorized(address addr, bool isAuthorized) external onlyOwner { authorized[addr] = isAuthorized; }

    function updatePosition(address follower, address leader, address token, uint256 amount, uint256 cost) external onlyAuthorized {
        Position storage pos = positions[follower][leader][token];
        if (pos.entryAmount == 0) {
            pos.token = token; pos.entryAmount = amount; pos.totalCostSTT = cost; pos.avgEntryPrice = (cost * 1e18) / amount;
            if (!_hasActiveToken[follower][leader][token]) { _activeTokens[follower][leader].push(token); _hasActiveToken[follower][leader][token] = true; }
        } else {
            uint256 totalAmount = pos.entryAmount + amount; uint256 totalCost = pos.totalCostSTT + cost;
            pos.entryAmount = totalAmount; pos.totalCostSTT = totalCost; pos.avgEntryPrice = (totalCost * 1e18) / totalAmount;
        }
        emit PositionUpdated(follower, leader, token, pos.entryAmount, getUnrealizedPnl(follower, leader));
    }

    function closePosition(address follower, address leader, address token, int256 pnl) external onlyAuthorized {
        Position storage pos = positions[follower][leader][token];
        require(pos.entryAmount > 0, "No position");
        realizedPnl[follower][leader] += pnl;
        delete positions[follower][leader][token];
        _removeActiveToken(follower, leader, token);
        emit PositionUpdated(follower, leader, token, 0, 0);
    }

    function getPosition(address follower, address leader, address token) external view returns (Position memory) { return positions[follower][leader][token]; }
    function getActiveTokens(address follower, address leader) external view returns (address[] memory) { return _activeTokens[follower][leader]; }

    function getUnrealizedPnl(address follower, address leader) public view returns (int256) {
        int256 unrealized = realizedPnl[follower][leader];
        address[] storage tokens = _activeTokens[follower][leader];
        for (uint256 i = 0; i < tokens.length; i++) {
            Position storage pos = positions[follower][leader][tokens[i]];
            if (pos.entryAmount == 0) continue;
            if (tokens[i] == baseToken) { unrealized += int256(pos.entryAmount) - int256(pos.totalCostSTT); }
            else { try dex.getAmountOut(tokens[i], baseToken, pos.entryAmount) returns (uint256 currentValue) { unrealized += int256(currentValue) - int256(pos.totalCostSTT); } catch {} }
        }
        return unrealized;
    }

    function _removeActiveToken(address follower, address leader, address token) internal {
        if (!_hasActiveToken[follower][leader][token]) return;
        address[] storage tokens = _activeTokens[follower][leader];
        for (uint256 i = 0; i < tokens.length; i++) { if (tokens[i] == token) { tokens[i] = tokens[tokens.length - 1]; tokens.pop(); break; } }
        _hasActiveToken[follower][leader][token] = false;
    }
}
