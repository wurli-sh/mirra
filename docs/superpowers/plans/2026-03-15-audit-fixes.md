# MirrorX Audit Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical, high, and medium severity issues found during the contract audit.

**Architecture:** Convert FollowerVault from native-STT deposits to ERC20 base token deposits so the mirror cascade actually works. Fix fee calculation, approval safety, subscription config, and all broken tests.

**Tech Stack:** Solidity 0.8.30, Hardhat, OpenZeppelin 5.x, @somnia-chain/reactivity SDK, viem

---

## File Structure

### Modified Files
- `contracts/FollowerVault.sol` — Convert from native STT to ERC20 base token deposits
- `contracts/interfaces/IFollowerVault.sol` — Update interface to match new ERC20 deposit pattern
- `contracts/MirrorExecutor.sol` — Fix `approve` → `forceApprove`, fix fee calculation
- `contracts/scripts/setup-subscriptions.ts` — Fix sub2 handler address
- `contracts/scripts/deploy.ts` — Update for new FollowerVault constructor (baseToken param)
- `contracts/test/FollowerVault.test.ts` — Rewrite for ERC20 deposits
- `contracts/test/MirrorExecutor.test.ts` — Update for ERC20-based vault
- `contracts/test/RiskGuardian.test.ts` — Update for ERC20-based vault
- `contracts/test/FullCascade.test.ts` — Update full integration test
- `contracts/test/SimpleDEX.test.ts` — Fix chai matchers
- `contracts/test/LeaderRegistry.test.ts` — Fix chai matchers (minor)
- `contracts/test/PositionTracker.test.ts` — Fix chai matchers (minor)
- `contracts/test/ReputationEngine.test.ts` — Fix chai matchers (minor)

---

## Chunk 1: Core Contract Fixes

### Task 1: Convert FollowerVault to ERC20 Base Token

**Files:**
- Modify: `contracts/interfaces/IFollowerVault.sol`
- Modify: `contracts/FollowerVault.sol`

- [ ] **Step 1: Update IFollowerVault interface**

Add `baseToken()` view function. Change `follow()` and `deposit()` from `payable` to take `uint256 amount` parameter. Remove `receive()`.

```solidity
// IFollowerVault.sol changes:
// Add:
function baseToken() external view returns (address);

// Change follow signature:
function follow(address leader, uint256 amount, uint256 maxPerTrade, uint16 maxSlippageBps, uint256 stopLossSTT) external;

// Change deposit signature:
function deposit(address leader, uint256 amount) external;
```

- [ ] **Step 2: Rewrite FollowerVault.sol for ERC20**

Key changes:
1. Add `IERC20 public immutable baseToken` in constructor
2. Add `ReentrancyGuard` (audit issue #7)
3. `follow()`: Remove `payable`, use `safeTransferFrom` for ERC20 deposit
4. `deposit()`: Remove `payable`, use `safeTransferFrom`
5. `withdraw()`: Use `safeTransfer` instead of `.call{value}`
6. `unfollow()`: Use `safeTransfer` instead of `.call{value}`
7. `emergencyClose()`: Use `safeTransfer` instead of `.call{value}`
8. `claimFees()`: Use `safeTransfer` instead of `.call{value}`
9. Remove `receive() external payable {}`

Full replacement contract:

```solidity
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
    mapping(address => uint256) public pendingFees;

    address public mirrorExecutor;
    address public riskGuardian;

    modifier onlyMirrorExecutor() {
        require(msg.sender == mirrorExecutor, "Only MirrorExecutor");
        _;
    }

    modifier onlyRiskGuardian() {
        require(msg.sender == riskGuardian, "Only RiskGuardian");
        _;
    }

    constructor(address _leaderRegistry, address _baseToken) Ownable(msg.sender) {
        leaderRegistry = ILeaderRegistry(_leaderRegistry);
        baseToken = IERC20(_baseToken);
    }

    // ... rest follows same logic but with ERC20 transfers
}
```

- [ ] **Step 3: Compile and verify no errors**

Run: `npx hardhat compile`
Expected: Successful compilation

- [ ] **Step 4: Commit**

```bash
git add contracts/FollowerVault.sol contracts/interfaces/IFollowerVault.sol
git commit -m "fix: convert FollowerVault from native STT to ERC20 base token deposits"
```

---

### Task 2: Fix MirrorExecutor Issues

**Files:**
- Modify: `contracts/MirrorExecutor.sol`

- [ ] **Step 1: Replace `approve` with `forceApprove`**

Line 84: Change `IERC20(tokenIn).approve(address(dex), followerAmount)` to `IERC20(tokenIn).forceApprove(address(dex), followerAmount)`

- [ ] **Step 2: Fix fee calculation to use same-unit comparison**

Lines 99-103: The current code compares `actualOut` (tokenOut units) with `followerAmount` (tokenIn units). Fix by using the DEX's price to normalize, or simplify by always taking a flat percentage fee on the trade volume.

Simplest correct approach — flat 5% fee on trade volume (not profit):
```solidity
// Replace profit-based fee with volume-based fee
uint256 fee = followerAmount * 5 / 10000; // 0.05% of volume (5 bps)
if (fee > 0) {
    followerVault.accrueFee(leader, fee);
}
```

Alternative: keep profit-based but compare in same token by querying DEX for cost basis:
```solidity
// Get what followerAmount of tokenIn is worth in tokenOut
uint256 costBasis = dex.getAmountOut(tokenIn, tokenOut, followerAmount);
// Note: this was the expected output BEFORE the swap moved the price
// Better: just use the ratio from the leader's trade
uint256 expectedOut = (leaderAmountOut * followerAmount) / leaderAmountIn;
if (actualOut > expectedOut) {
    uint256 profit = actualOut - expectedOut;
    uint256 fee = profit * 5 / 100;
    followerVault.accrueFee(leader, fee);
}
```

We'll use the leader-ratio approach since `expectedOut` is already computed on line 77.

- [ ] **Step 3: Compile**

Run: `npx hardhat compile`
Expected: Success

- [ ] **Step 4: Commit**

```bash
git add contracts/MirrorExecutor.sol
git commit -m "fix: use forceApprove and fix fee calculation in MirrorExecutor"
```

---

### Task 3: Fix setup-subscriptions.ts

**Files:**
- Modify: `contracts/scripts/setup-subscriptions.ts`

- [ ] **Step 1: Add RiskGuardian address to ADDRESSES and fix sub2 handler**

```typescript
const ADDRESSES = {
  simpleDEX: "0x..." as `0x${string}`,
  mirrorExecutor: "0x..." as `0x${string}`,
  riskGuardian: "0x..." as `0x${string}`,  // ADD THIS
};

// Fix line 74:
handlerContractAddress: ADDRESSES.riskGuardian,  // was mirrorExecutor
```

- [ ] **Step 2: Commit**

```bash
git add contracts/scripts/setup-subscriptions.ts
git commit -m "fix: point sub2 handler to RiskGuardian instead of MirrorExecutor"
```

---

### Task 4: Update Deploy Script

**Files:**
- Modify: `contracts/scripts/deploy.ts`

- [ ] **Step 1: Update FollowerVault deployment to pass baseToken**

```typescript
// Change line 40:
const vault = await FollowerVault.deploy(await registry.getAddress(), await stt.getAddress());
```

- [ ] **Step 2: Add ERC20 token minting for followers in seed data**

After deployment, followers need ERC20 STT tokens (not native STT) to deposit into the vault. Update seed.ts accordingly.

- [ ] **Step 3: Commit**

```bash
git add contracts/scripts/deploy.ts
git commit -m "fix: update deploy script for ERC20-based FollowerVault"
```

---

## Chunk 2: Fix All Tests

### Task 5: Fix SimpleDEX Tests

**Files:**
- Modify: `contracts/test/SimpleDEX.test.ts`

- [ ] **Step 1: Fix import path**

The test imports from `../typechain-types` but the test file is in `contracts/test/`. The correct relative path is `../../typechain-types`.

- [ ] **Step 2: Fix all test assertions**

Issues:
- `revertedWith` works with hardhat-chai-matchers (should be fine if `@nomicfoundation/hardhat-toolbox` is imported in config)
- `closeTo` on BigInt needs `.to.be.closeTo(expected, delta)` with BigInt values
- `emit` needs the toolbox imported

Actually the real issue is that tests import from wrong typechain path. Tests in `contracts/test/` need `../../typechain-types` not `../typechain-types`.

Wait, looking at the existing tests: `SimpleDEX.test.ts` imports from `../typechain-types` (wrong), while `FullCascade.test.ts` imports from `../../typechain-types` (correct). Fix the import paths.

- [ ] **Step 3: Run tests**

Run: `npx hardhat test contracts/test/SimpleDEX.test.ts`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add contracts/test/SimpleDEX.test.ts
git commit -m "fix: correct SimpleDEX test import paths and assertions"
```

---

### Task 6: Fix LeaderRegistry Tests

**Files:**
- Modify: `contracts/test/LeaderRegistry.test.ts`

- [ ] **Step 1: Fix import path from `../typechain-types` to `../../typechain-types`**

- [ ] **Step 2: Run tests**

Run: `npx hardhat test contracts/test/LeaderRegistry.test.ts`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add contracts/test/LeaderRegistry.test.ts
git commit -m "fix: correct LeaderRegistry test import path"
```

---

### Task 7: Fix FollowerVault Tests

**Files:**
- Modify: `contracts/test/FollowerVault.test.ts`

- [ ] **Step 1: Rewrite for ERC20 deposits**

Key changes:
- Deploy MockERC20 as base token
- Pass base token to FollowerVault constructor
- `follow()` now takes `(leader, amount, maxPerTrade, slippage, stopLoss)` — no `{ value }`
- Need to `mint` + `approve` base token before following
- `deposit()` now takes `(leader, amount)` — no `{ value }`
- `withdraw()` and `unfollow()` return ERC20 tokens

- [ ] **Step 2: Fix import path to `../../typechain-types`**

- [ ] **Step 3: Run tests**

Run: `npx hardhat test contracts/test/FollowerVault.test.ts`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add contracts/test/FollowerVault.test.ts
git commit -m "fix: rewrite FollowerVault tests for ERC20 deposits"
```

---

### Task 8: Fix PositionTracker Tests

**Files:**
- Modify: `contracts/test/PositionTracker.test.ts`

- [ ] **Step 1: Fix import path from `../typechain-types` to `../../typechain-types`**

- [ ] **Step 2: Run tests**

Run: `npx hardhat test contracts/test/PositionTracker.test.ts`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add contracts/test/PositionTracker.test.ts
git commit -m "fix: correct PositionTracker test import path"
```

---

### Task 9: Fix ReputationEngine Tests

**Files:**
- Modify: `contracts/test/ReputationEngine.test.ts`

- [ ] **Step 1: Fix import path from `../typechain-types` to `../../typechain-types`**

- [ ] **Step 2: Run tests**

Run: `npx hardhat test contracts/test/ReputationEngine.test.ts`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add contracts/test/ReputationEngine.test.ts
git commit -m "fix: correct ReputationEngine test import path"
```

---

### Task 10: Fix MirrorExecutor Tests

**Files:**
- Modify: `contracts/test/MirrorExecutor.test.ts`

- [ ] **Step 1: Update FollowerVault deployment in beforeEach to pass baseToken**

- [ ] **Step 2: Run tests**

Run: `npx hardhat test contracts/test/MirrorExecutor.test.ts`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add contracts/test/MirrorExecutor.test.ts
git commit -m "fix: update MirrorExecutor tests for ERC20-based vault"
```

---

### Task 11: Fix RiskGuardian Tests

**Files:**
- Modify: `contracts/test/RiskGuardian.test.ts`

- [ ] **Step 1: Update FollowerVault deployment in beforeEach to pass baseToken**

- [ ] **Step 2: Run tests**

Run: `npx hardhat test contracts/test/RiskGuardian.test.ts`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add contracts/test/RiskGuardian.test.ts
git commit -m "fix: update RiskGuardian tests for ERC20-based vault"
```

---

### Task 12: Fix FullCascade Integration Test

**Files:**
- Modify: `contracts/test/FullCascade.test.ts`

- [ ] **Step 1: Update for ERC20-based FollowerVault**

- Deploy base token (STT MockERC20)
- Pass to FollowerVault constructor
- Followers mint + approve base token before `follow()`
- Update all `follow()` calls to new signature (no `{ value }`)

- [ ] **Step 2: Run full test suite**

Run: `npx hardhat test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add contracts/test/FullCascade.test.ts
git commit -m "fix: update FullCascade integration test for ERC20-based vault"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx hardhat test`
Expected: All tests pass (0 failures)

- [ ] **Step 2: Run compilation**

Run: `npx hardhat compile`
Expected: Clean compilation
