import { expect } from "chai";
import { ethers } from "hardhat";
import { ReputationEngine } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ReputationEngine", function () {
  let engine: ReputationEngine;
  let owner: SignerWithAddress;
  let authorized: SignerWithAddress;
  let leader: SignerWithAddress;

  beforeEach(async function () {
    [owner, authorized, leader] = await ethers.getSigners();
    const ReputationEngine = await ethers.getContractFactory("ReputationEngine");
    engine = await ReputationEngine.deploy();
    await engine.setAuthorized(authorized.address, true);
  });

  describe("recordTrade", function () {
    it("should increment trade count and volume", async function () {
      const volume = ethers.parseEther("100");
      await engine.connect(authorized).recordTrade(leader.address, volume);
      const stats = await engine.getStats(leader.address);
      expect(stats.totalTrades).to.equal(1n);
      expect(stats.totalVolumeSTT).to.equal(volume);
    });

    it("should revert if not authorized", async function () {
      try { await engine.connect(leader).recordTrade(leader.address, 100); expect.fail("Expected revert"); } catch (error: any) { expect(error.message).to.include("Not authorized"); }
    });

    it("should emit ReputationUpdated", async function () {
      const tx = await engine.connect(authorized).recordTrade(leader.address, ethers.parseEther("100"));
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => { try { return engine.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "ReputationUpdated"; } catch { return false; } });
      expect(event).to.not.be.undefined;
    });
  });

  describe("recordClose", function () {
    it("should track profitable trades", async function () {
      await engine.connect(authorized).recordTrade(leader.address, ethers.parseEther("100"));
      await engine.connect(authorized).recordClose(leader.address, ethers.parseEther("10"));
      const stats = await engine.getStats(leader.address);
      expect(stats.profitableTrades).to.equal(1n);
      expect(stats.totalPnlSTT).to.equal(ethers.parseEther("10"));
    });

    it("should track losing trades", async function () {
      await engine.connect(authorized).recordTrade(leader.address, ethers.parseEther("100"));
      await engine.connect(authorized).recordClose(leader.address, ethers.parseEther("-5"));
      const stats = await engine.getStats(leader.address);
      expect(stats.profitableTrades).to.equal(0n);
      expect(stats.totalPnlSTT).to.equal(ethers.parseEther("-5"));
    });
  });

  describe("score calculation", function () {
    it("should calculate score based on win rate, volume, and recency", async function () {
      await engine.connect(authorized).recordTrade(leader.address, ethers.parseEther("500"));
      await engine.connect(authorized).recordClose(leader.address, ethers.parseEther("10"));
      const score = await engine.getScore(leader.address);
      expect(score > 0n).to.be.true;
    });
  });
});
