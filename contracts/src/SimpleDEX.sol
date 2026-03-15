// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interfaces/ISimpleDEX.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleDEX is ISimpleDEX, Ownable {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public reserves;
    mapping(address => bool) public authorizedSwappers;
    mapping(bytes32 => uint256) public totalShares;
    mapping(bytes32 => mapping(address => uint256)) public providerShares;

    constructor() Ownable(msg.sender) {}

    function setAuthorizedSwapper(address swapper, bool authorized) external onlyOwner {
        authorizedSwappers[swapper] = authorized;
    }

    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external {
        require(tokenA != tokenB, "Same token");
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        (address t0, address t1) = _sort(tokenA, tokenB);
        (uint256 a0, uint256 a1) = tokenA == t0 ? (amountA, amountB) : (amountB, amountA);

        bytes32 pairKey = keccak256(abi.encodePacked(t0, t1));
        uint256 shares;

        if (totalShares[pairKey] == 0) {
            shares = _sqrt(a0 * a1);
            require(shares > 0, "Insufficient liquidity");
        } else {
            uint256 share0 = (a0 * totalShares[pairKey]) / reserves[t0][t1];
            uint256 share1 = (a1 * totalShares[pairKey]) / reserves[t1][t0];
            shares = share0 < share1 ? share0 : share1;
        }

        reserves[t0][t1] += a0;
        reserves[t1][t0] += a1;
        totalShares[pairKey] += shares;
        providerShares[pairKey][msg.sender] += shares;

        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB);
    }

    function removeLiquidity(address tokenA, address tokenB, uint256 shares) external {
        require(tokenA != tokenB, "Same token");
        (address t0, address t1) = _sort(tokenA, tokenB);
        bytes32 pairKey = keccak256(abi.encodePacked(t0, t1));

        require(providerShares[pairKey][msg.sender] >= shares, "Insufficient shares");
        require(totalShares[pairKey] > 0, "No liquidity");

        uint256 amount0 = (shares * reserves[t0][t1]) / totalShares[pairKey];
        uint256 amount1 = (shares * reserves[t1][t0]) / totalShares[pairKey];

        providerShares[pairKey][msg.sender] -= shares;
        totalShares[pairKey] -= shares;
        reserves[t0][t1] -= amount0;
        reserves[t1][t0] -= amount1;

        IERC20(t0).safeTransfer(msg.sender, amount0);
        IERC20(t1).safeTransfer(msg.sender, amount1);

        (uint256 amtA, uint256 amtB) = tokenA == t0 ? (amount0, amount1) : (amount1, amount0);
        emit LiquidityRemoved(msg.sender, tokenA, tokenB, amtA, amtB);
    }

    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut) {
        amountOut = _executeSwap(tokenIn, tokenOut, amountIn, minAmountOut, msg.sender, msg.sender);
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    function swapFor(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address from, address to) external returns (uint256 amountOut) {
        require(authorizedSwappers[msg.sender], "Not authorized");
        amountOut = _executeSwap(tokenIn, tokenOut, amountIn, minAmountOut, from, to);
        emit Swap(from, tokenIn, tokenOut, amountIn, amountOut);
    }

    function getReserves(address tokenA, address tokenB) external view returns (uint256, uint256) {
        (address t0, address t1) = _sort(tokenA, tokenB);
        return (reserves[t0][t1], reserves[t1][t0]);
    }

    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256) {
        (address t0, address t1) = _sort(tokenIn, tokenOut);
        uint256 reserveIn = tokenIn == t0 ? reserves[t0][t1] : reserves[t1][t0];
        uint256 reserveOut = tokenIn == t0 ? reserves[t1][t0] : reserves[t0][t1];
        require(reserveIn > 0 && reserveOut > 0, "No liquidity");
        uint256 amountInWithFee = amountIn * 997;
        return (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }

    function _executeSwap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address from, address to) internal returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "Same token");
        amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        require(amountOut >= minAmountOut, "Slippage exceeded");
        IERC20(tokenIn).safeTransferFrom(from, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(to, amountOut);
        (address t0, address t1) = _sort(tokenIn, tokenOut);
        if (tokenIn == t0) { reserves[t0][t1] += amountIn; reserves[t1][t0] -= amountOut; }
        else { reserves[t1][t0] += amountIn; reserves[t0][t1] -= amountOut; }
    }

    function _sort(address a, address b) internal pure returns (address, address) { return a < b ? (a, b) : (b, a); }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        y = x;
        uint256 z = (x + 1) / 2;
        while (z < y) { y = z; z = (x / z + z) / 2; }
    }
}
