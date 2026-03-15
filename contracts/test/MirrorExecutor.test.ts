import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleDEX, LeaderRegistry, FollowerVault, PositionTracker, ReputationEngine, MirrorExecutor, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MirrorExecutor", function () {
  let dex: SimpleDEX; let registry: LeaderRegistry; let vault: FollowerVault;
  let posTracker: PositionTracker; let repEngine: ReputationEngine; let executor: MirrorExecutor;
  let tokenA: MockERC20; let tokenB: MockERC20;
  let owner: SignerWithAddress; let leader: SignerWithAddress;

  const LIQUIDITY = ethers.parseEther("100000");
  const MIN_STAKE = ethers.parseEther("10");

  beforeEach(async function () {
    [owner, leader] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("STT", "STT");
    tokenB = await MockERC20.deploy("USDC", "USDC");
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy();
    const LeaderRegistry = await ethers.getContractFactory("LeaderRegistry");
    registry = await LeaderRegistry.deploy();
    const FollowerVault = await ethers.getContractFactory("FollowerVault");
    vault = await FollowerVault.deploy(await registry.getAddress(), await tokenA.getAddress());
    const PositionTracker = await ethers.getContractFactory("PositionTracker");
    posTracker = await PositionTracker.deploy(await dex.getAddress(), await tokenA.getAddress());
    const ReputationEngine = await ethers.getContractFactory("ReputationEngine");
    repEngine = await ReputationEngine.deploy();
    const MirrorExecutor = await ethers.getContractFactory("MirrorExecutor");
    executor = await MirrorExecutor.deploy(await dex.getAddress(), await registry.getAddress(), await vault.getAddress(), await posTracker.getAddress(), await repEngine.getAddress());
    await dex.setAuthorizedSwapper(await executor.getAddress(), true);
    await vault.setMirrorExecutor(await executor.getAddress());
    await posTracker.setAuthorized(await executor.getAddress(), true);
    await repEngine.setAuthorized(await executor.getAddress(), true);
    await tokenA.mint(owner.address, LIQUIDITY * 2n);
    await tokenB.mint(owner.address, LIQUIDITY * 2n);
    await tokenA.approve(await dex.getAddress(), ethers.MaxUint256);
    await tokenB.approve(await dex.getAddress(), ethers.MaxUint256);
    await dex.addLiquidity(await tokenA.getAddress(), await tokenB.getAddress(), LIQUIDITY, LIQUIDITY);
    await registry.connect(leader).registerLeader({ value: MIN_STAKE });
  });

  describe("constructor", function () {
    it("should set immutable addresses", async function () {
      expect(await executor.dex()).to.equal(await dex.getAddress());
      expect(await executor.leaderRegistry()).to.equal(await registry.getAddress());
      expect(await executor.followerVault()).to.equal(await vault.getAddress());
    });
  });

  describe("constants", function () {
    it("should have correct SWAP_SIG", async function () {
      const expected = ethers.keccak256(ethers.toUtf8Bytes("Swap(address,address,address,uint256,uint256)"));
      expect(await executor.SWAP_SIG()).to.equal(expected);
    });

    it("should cap at 5 followers per mirror", async function () {
      expect(await executor.MAX_FOLLOWERS_PER_MIRROR()).to.equal(5);
    });

    it("should have correct MIRROR_CONTINUE_SIG", async function () {
      const expected = ethers.keccak256(ethers.toUtf8Bytes("MirrorContinue(address,address,address,uint256,uint256,uint256)"));
      expect(await executor.MIRROR_CONTINUE_SIG()).to.equal(expected);
    });
  });
});
