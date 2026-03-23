import { expect } from "chai";
import { ethers } from "hardhat";
import { FollowerVault, LeaderRegistry, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FollowerVault", function () {
  let vault: FollowerVault;
  let registry: LeaderRegistry;
  let baseToken: MockERC20;
  let owner: SignerWithAddress;
  let leader: SignerWithAddress;
  let follower1: SignerWithAddress;
  let follower2: SignerWithAddress;
  let executor: SignerWithAddress;
  let guardian: SignerWithAddress;

  const MIN_STAKE = ethers.parseEther("10");
  const DEPOSIT = ethers.parseEther("5");
  const MAX_PER_TRADE = ethers.parseEther("1");
  const SLIPPAGE_BPS = 100;
  const STOP_LOSS = ethers.parseEther("2");

  beforeEach(async function () {
    [owner, leader, follower1, follower2, executor, guardian] = await ethers.getSigners();
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    baseToken = await MockERC20Factory.deploy("Base Token", "BASE");
    const LeaderRegistry = await ethers.getContractFactory("LeaderRegistry");
    registry = await LeaderRegistry.deploy();
    const FollowerVault = await ethers.getContractFactory("FollowerVault");
    vault = await FollowerVault.deploy(await registry.getAddress(), await baseToken.getAddress());
    await vault.setMirrorExecutor(executor.address);
    await vault.setRiskGuardian(guardian.address);
    await registry.connect(leader).registerLeader({ value: MIN_STAKE });
  });

  async function mintAndApprove(signer: SignerWithAddress, amount: bigint) {
    await baseToken.mint(signer.address, amount);
    await baseToken.connect(signer).approve(await vault.getAddress(), amount);
  }

  describe("follow", function () {
    it("should follow a leader with deposit", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await expect(vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS))
        .to.emit(vault, "Followed").withArgs(follower1.address, leader.address, DEPOSIT, MAX_PER_TRADE);
      const pos = await vault.getPosition(follower1.address, leader.address);
      expect(pos.active).to.be.true;
      expect(pos.depositedSTT).to.equal(DEPOSIT);
    });

    it("should revert with zero deposit", async function () {
      await expect(vault.connect(follower1).follow(leader.address, 0, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS))
        .to.be.revertedWith("Must deposit STT");
    });

    it("should revert if not a leader", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await expect(vault.connect(follower1).follow(follower2.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS))
        .to.be.revertedWith("Not a leader");
    });

    it("should revert if already following", async function () {
      await mintAndApprove(follower1, DEPOSIT * 2n);
      await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      await expect(vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS))
        .to.be.revertedWith("Already following");
    });
  });

  describe("unfollow", function () {
    it("should unfollow and return deposit", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      const balBefore = await baseToken.balanceOf(follower1.address);
      await expect(vault.connect(follower1).unfollow(leader.address)).to.emit(vault, "Unfollowed");
      const balAfter = await baseToken.balanceOf(follower1.address);
      expect(balAfter - balBefore).to.equal(DEPOSIT);
    });

    it("should revert if not following", async function () {
      await expect(vault.connect(follower1).unfollow(leader.address)).to.be.revertedWith("Not following");
    });
  });

  describe("deposit", function () {
    it("should add more STT to existing position", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      const extra = ethers.parseEther("3");
      await mintAndApprove(follower1, extra);
      await expect(vault.connect(follower1).deposit(leader.address, extra)).to.emit(vault, "Deposited");
      const pos = await vault.getPosition(follower1.address, leader.address);
      expect(pos.depositedSTT).to.equal(DEPOSIT + extra);
    });
  });

  describe("withdraw", function () {
    it("should partially withdraw", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      const withdrawAmount = ethers.parseEther("2");
      await expect(vault.connect(follower1).withdraw(leader.address, withdrawAmount)).to.emit(vault, "Withdrawn");
      const pos = await vault.getPosition(follower1.address, leader.address);
      expect(pos.depositedSTT).to.equal(DEPOSIT - withdrawAmount);
    });

    it("should revert if insufficient balance", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      await expect(vault.connect(follower1).withdraw(leader.address, DEPOSIT + 1n)).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("getFollowers", function () {
    it("should return paginated followers", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      await mintAndApprove(follower2, DEPOSIT);
      await vault.connect(follower2).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      const all = await vault.getFollowers(leader.address, 0, 10);
      expect(all.length).to.equal(2);
    });

    it("should return empty for out of range offset", async function () {
      const result = await vault.getFollowers(leader.address, 100, 10);
      expect(result.length).to.equal(0);
    });
  });

  describe("access control", function () {
    it("pullTokens should revert if not MirrorExecutor", async function () {
      await expect(vault.connect(follower1).pullTokens(follower1.address, leader.address, ethers.ZeroAddress, 100))
        .to.be.revertedWith("Only MirrorExecutor");
    });

    it("emergencyClose should revert if not RiskGuardian", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      await expect(vault.connect(follower1).emergencyClose(follower1.address, leader.address))
        .to.be.revertedWith("Only RiskGuardian");
    });

    it("emergencyClose should work for RiskGuardian", async function () {
      await mintAndApprove(follower1, DEPOSIT);
      await vault.connect(follower1).follow(leader.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
      const balBefore = await baseToken.balanceOf(follower1.address);
      await expect(vault.connect(guardian).emergencyClose(follower1.address, leader.address))
        .to.emit(vault, "EmergencyClosed");
      const balAfter = await baseToken.balanceOf(follower1.address);
      expect(balAfter - balBefore).to.equal(DEPOSIT);
    });
  });

  describe("claimFees", function () {
    it("should revert if not a leader", async function () {
      await expect(vault.connect(follower1).claimFees(await baseToken.getAddress())).to.be.revertedWith("Not a leader");
    });

    it("should revert if no fees", async function () {
      await expect(vault.connect(leader).claimFees(await baseToken.getAddress())).to.be.revertedWith("No fees to claim");
    });
  });
});
