import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleDEX, LeaderRegistry, FollowerVault, PositionTracker, ReputationEngine, MirrorExecutor, RiskGuardian, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FullCascade Integration", function () {
  let dex: SimpleDEX; let registry: LeaderRegistry; let vault: FollowerVault;
  let posTracker: PositionTracker; let repEngine: ReputationEngine;
  let executor: MirrorExecutor; let guardian: RiskGuardian;
  let tokenA: MockERC20; let tokenB: MockERC20; let baseToken: MockERC20;
  let owner: SignerWithAddress; let leader: SignerWithAddress;
  let follower1: SignerWithAddress; let follower2: SignerWithAddress;

  const LIQUIDITY = ethers.parseEther("100000");
  const MIN_STAKE = ethers.parseEther("10");
  const DEPOSIT = ethers.parseEther("100");
  const MAX_PER_TRADE = ethers.parseEther("50");
  const SLIPPAGE_BPS = 500;
  const STOP_LOSS = ethers.parseEther("20");
  const SWAP_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, leader, follower1, follower2] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("STT", "STT");
    tokenB = await MockERC20.deploy("USDC", "USDC");
    baseToken = tokenA;
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy();
    const LeaderRegistry = await ethers.getContractFactory("LeaderRegistry");
    registry = await LeaderRegistry.deploy();
    const FollowerVault = await ethers.getContractFactory("FollowerVault");
    vault = await FollowerVault.deploy(await registry.getAddress(), await baseToken.getAddress());
    const PositionTracker = await ethers.getContractFactory("PositionTracker");
    posTracker = await PositionTracker.deploy(await dex.getAddress(), await baseToken.getAddress());
    const ReputationEngine = await ethers.getContractFactory("ReputationEngine");
    repEngine = await ReputationEngine.deploy();
    const MirrorExecutor = await ethers.getContractFactory("MirrorExecutor");
    executor = await MirrorExecutor.deploy(await dex.getAddress(), await registry.getAddress(), await vault.getAddress(), await posTracker.getAddress(), await repEngine.getAddress());
    const RiskGuardian = await ethers.getContractFactory("RiskGuardian");
    guardian = await RiskGuardian.deploy(await vault.getAddress(), await posTracker.getAddress(), await repEngine.getAddress());
    await dex.setAuthorizedSwapper(await executor.getAddress(), true);
    await vault.setMirrorExecutor(await executor.getAddress());
    await vault.setRiskGuardian(await guardian.getAddress());
    await posTracker.setAuthorized(await executor.getAddress(), true);
    await posTracker.setAuthorized(await guardian.getAddress(), true);
    await repEngine.setAuthorized(await executor.getAddress(), true);
    await repEngine.setAuthorized(await guardian.getAddress(), true);
    await tokenA.mint(owner.address, LIQUIDITY * 2n);
    await tokenB.mint(owner.address, LIQUIDITY * 2n);
    await tokenA.approve(await dex.getAddress(), ethers.MaxUint256);
    await tokenB.approve(await dex.getAddress(), ethers.MaxUint256);
    await dex.addLiquidity(await tokenA.getAddress(), await tokenB.getAddress(), LIQUIDITY, LIQUIDITY);
  });

  it("should deploy all contracts and set access controls", async function () {
    expect(await dex.authorizedSwappers(await executor.getAddress())).to.be.true;
    expect(await vault.mirrorExecutor()).to.equal(await executor.getAddress());
    expect(await vault.riskGuardian()).to.equal(await guardian.getAddress());
    expect(await posTracker.authorized(await executor.getAddress())).to.be.true;
    expect(await posTracker.authorized(await guardian.getAddress())).to.be.true;
  });

  it("should register leader and create follower positions", async function () {
    await registry.connect(leader).registerLeader({ value: MIN_STAKE });
    expect(await registry.isLeader(leader.address)).to.be.true;
    await baseToken.mint(follower1.address, DEPOSIT);
    await baseToken.connect(follower1).approve(await vault.getAddress(), DEPOSIT);
    await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
    await baseToken.mint(follower2.address, DEPOSIT);
    await baseToken.connect(follower2).approve(await vault.getAddress(), DEPOSIT);
    await vault.connect(follower2).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
    expect(await vault.getFollowerCount(leader.address)).to.equal(2);
    expect(await vault.totalFollowingSTT(leader.address)).to.equal(DEPOSIT * 2n);
  });

  it("should allow leader to swap on DEX", async function () {
    await tokenA.mint(leader.address, SWAP_AMOUNT);
    await tokenA.connect(leader).approve(await dex.getAddress(), SWAP_AMOUNT);
    const expectedOut = await dex.getAmountOut(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT);
    await expect(dex.connect(leader).swap(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT, 0))
      .to.emit(dex, "Swap").withArgs(leader.address, await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT, expectedOut);
  });

  it("should have correct RiskGuardian access control on vault", async function () {
    await registry.connect(leader).registerLeader({ value: MIN_STAKE });
    await baseToken.mint(follower1.address, DEPOSIT);
    await baseToken.connect(follower1).approve(await vault.getAddress(), DEPOSIT);
    await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
    expect(await vault.riskGuardian()).to.equal(await guardian.getAddress());
    await expect(vault.connect(owner).emergencyClose(follower1.address, leader.address)).to.be.revertedWith("Only RiskGuardian");
  });

  it("full deployment flow should work end-to-end", async function () {
    await registry.connect(leader).registerLeader({ value: MIN_STAKE });
    await baseToken.mint(follower1.address, DEPOSIT);
    await baseToken.connect(follower1).approve(await vault.getAddress(), DEPOSIT);
    await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
    await tokenA.mint(leader.address, SWAP_AMOUNT);
    await tokenA.connect(leader).approve(await dex.getAddress(), SWAP_AMOUNT);
    await dex.connect(leader).swap(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT, 0);
    const pos = await vault.getPosition(follower1.address, leader.address);
    expect(pos.active).to.be.true;
    expect(pos.depositedSTT).to.equal(DEPOSIT);
    await vault.connect(follower1).unfollow(leader.address);
    const posAfter = await vault.getPosition(follower1.address, leader.address);
    expect(posAfter.active).to.be.false;
    await registry.connect(leader).deregisterLeader();
    expect(await registry.isLeader(leader.address)).to.be.false;
  });
});
