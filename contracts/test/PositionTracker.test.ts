import { expect } from "chai";
import { ethers } from "hardhat";
import { PositionTracker, MockERC20, SimpleDEX } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PositionTracker", function () {
  let tracker: PositionTracker;
  let dex: SimpleDEX;
  let baseToken: MockERC20;
  let otherToken: MockERC20;
  let owner: SignerWithAddress;
  let authorized: SignerWithAddress;
  let follower: SignerWithAddress;
  let leader: SignerWithAddress;

  beforeEach(async function () {
    [owner, authorized, follower, leader] = await ethers.getSigners();
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    baseToken = await MockERC20Factory.deploy("Somnia Token", "STT");
    otherToken = await MockERC20Factory.deploy("USD Coin", "USDC");
    const SimpleDEXFactory = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEXFactory.deploy();
    const liqAmount = ethers.parseEther("10000");
    await baseToken.mint(owner.address, liqAmount);
    await otherToken.mint(owner.address, liqAmount);
    await baseToken.approve(await dex.getAddress(), liqAmount);
    await otherToken.approve(await dex.getAddress(), liqAmount);
    await dex.addLiquidity(await baseToken.getAddress(), await otherToken.getAddress(), liqAmount, liqAmount);
    const PositionTrackerFactory = await ethers.getContractFactory("PositionTracker");
    tracker = await PositionTrackerFactory.deploy(await dex.getAddress(), await baseToken.getAddress());
    await tracker.setAuthorized(authorized.address, true);
  });

  describe("updatePosition", function () {
    it("should create new position", async function () {
      await tracker.connect(authorized).updatePosition(follower.address, leader.address, await otherToken.getAddress(), ethers.parseEther("100"), ethers.parseEther("50"));
      const pos = await tracker.getPosition(follower.address, leader.address, await otherToken.getAddress());
      expect(pos.entryAmount).to.equal(ethers.parseEther("100"));
      expect(pos.totalCostSTT).to.equal(ethers.parseEther("50"));
    });

    it("should average into existing position", async function () {
      const tokenAddr = await otherToken.getAddress();
      await tracker.connect(authorized).updatePosition(follower.address, leader.address, tokenAddr, ethers.parseEther("100"), ethers.parseEther("50"));
      await tracker.connect(authorized).updatePosition(follower.address, leader.address, tokenAddr, ethers.parseEther("100"), ethers.parseEther("100"));
      const pos = await tracker.getPosition(follower.address, leader.address, tokenAddr);
      expect(pos.entryAmount).to.equal(ethers.parseEther("200"));
      expect(pos.totalCostSTT).to.equal(ethers.parseEther("150"));
    });

    it("should revert if not authorized", async function () {
      try { await tracker.connect(follower).updatePosition(follower.address, leader.address, await otherToken.getAddress(), 100, 50); expect.fail("Expected revert"); } catch (error: any) { expect(error.message).to.include("Not authorized"); }
    });
  });

  describe("closePosition", function () {
    it("should close and record realized PnL", async function () {
      const tokenAddr = await otherToken.getAddress();
      await tracker.connect(authorized).updatePosition(follower.address, leader.address, tokenAddr, ethers.parseEther("100"), ethers.parseEther("50"));
      const pnl = ethers.parseEther("10");
      await tracker.connect(authorized).closePosition(follower.address, leader.address, tokenAddr, pnl);
      const pos = await tracker.getPosition(follower.address, leader.address, tokenAddr);
      expect(pos.entryAmount).to.equal(0n);
      const totalPnl = await tracker.getUnrealizedPnl(follower.address, leader.address);
      expect(totalPnl).to.equal(pnl);
    });

    it("should revert if no position", async function () {
      try { await tracker.connect(authorized).closePosition(follower.address, leader.address, await otherToken.getAddress(), 0); expect.fail("Expected revert"); } catch (error: any) { expect(error.message).to.include("No position"); }
    });
  });

  describe("getUnrealizedPnl", function () {
    it("should return mark-to-market PnL using DEX prices", async function () {
      const tokenAddr = await otherToken.getAddress();
      await tracker.connect(authorized).updatePosition(follower.address, leader.address, tokenAddr, ethers.parseEther("100"), ethers.parseEther("50"));
      const pnl = await tracker.getUnrealizedPnl(follower.address, leader.address);
      expect(pnl).to.be.gt(0);
      const currentValue = await dex.getAmountOut(tokenAddr, await baseToken.getAddress(), ethers.parseEther("100"));
      const expectedPnl = BigInt(currentValue) - ethers.parseEther("50");
      expect(pnl).to.equal(expectedPnl);
    });
  });

  describe("getActiveTokens", function () {
    it("should track active tokens for a follower-leader pair", async function () {
      const tokenAddr = await otherToken.getAddress();
      const baseAddr = await baseToken.getAddress();
      let tokens = await tracker.getActiveTokens(follower.address, leader.address);
      expect(tokens.length).to.equal(0);
      await tracker.connect(authorized).updatePosition(follower.address, leader.address, tokenAddr, ethers.parseEther("100"), ethers.parseEther("50"));
      tokens = await tracker.getActiveTokens(follower.address, leader.address);
      expect(tokens.length).to.equal(1);
      await tracker.connect(authorized).updatePosition(follower.address, leader.address, baseAddr, ethers.parseEther("200"), ethers.parseEther("200"));
      tokens = await tracker.getActiveTokens(follower.address, leader.address);
      expect(tokens.length).to.equal(2);
      await tracker.connect(authorized).closePosition(follower.address, leader.address, tokenAddr, 0);
      tokens = await tracker.getActiveTokens(follower.address, leader.address);
      expect(tokens.length).to.equal(1);
      expect(tokens[0]).to.equal(baseAddr);
    });
  });
});
