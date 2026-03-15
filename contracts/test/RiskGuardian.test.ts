import { expect } from "chai";
import { ethers } from "hardhat";
import { FollowerVault, LeaderRegistry, PositionTracker, ReputationEngine, RiskGuardian, MockERC20, SimpleDEX } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RiskGuardian", function () {
  let registry: LeaderRegistry; let vault: FollowerVault; let tracker: PositionTracker;
  let repEngine: ReputationEngine; let guardian: RiskGuardian; let dex: SimpleDEX; let baseToken: MockERC20;
  let owner: SignerWithAddress; let leader: SignerWithAddress; let follower: SignerWithAddress;

  const MIN_STAKE = ethers.parseEther("10");

  beforeEach(async function () {
    [owner, leader, follower] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    baseToken = await MockERC20.deploy("STT", "STT");
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy();
    const LeaderRegistry = await ethers.getContractFactory("LeaderRegistry");
    registry = await LeaderRegistry.deploy();
    const FollowerVault = await ethers.getContractFactory("FollowerVault");
    vault = await FollowerVault.deploy(await registry.getAddress(), await baseToken.getAddress());
    const PositionTracker = await ethers.getContractFactory("PositionTracker");
    tracker = await PositionTracker.deploy(await dex.getAddress(), await baseToken.getAddress());
    const ReputationEngine = await ethers.getContractFactory("ReputationEngine");
    repEngine = await ReputationEngine.deploy();
    const RiskGuardian = await ethers.getContractFactory("RiskGuardian");
    guardian = await RiskGuardian.deploy(await vault.getAddress(), await tracker.getAddress(), await repEngine.getAddress());
    await vault.setRiskGuardian(await guardian.getAddress());
    await tracker.setAuthorized(await guardian.getAddress(), true);
    await repEngine.setAuthorized(await guardian.getAddress(), true);
    await registry.connect(leader).registerLeader({ value: MIN_STAKE });
  });

  describe("constructor", function () {
    it("should set immutable addresses", async function () {
      expect(await guardian.vault()).to.equal(await vault.getAddress());
      expect(await guardian.tracker()).to.equal(await tracker.getAddress());
      expect(await guardian.reputation()).to.equal(await repEngine.getAddress());
    });
  });

  describe("constants", function () {
    it("should have correct MIRROR_SIG", async function () {
      const expected = ethers.keccak256(ethers.toUtf8Bytes("MirrorExecuted(address,address,address,address,uint256,uint256)"));
      expect(await guardian.MIRROR_SIG()).to.equal(expected);
    });
  });
});
