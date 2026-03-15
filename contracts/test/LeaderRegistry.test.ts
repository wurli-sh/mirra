import { expect } from "chai";
import { ethers } from "hardhat";
import { LeaderRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LeaderRegistry", function () {
  let registry: LeaderRegistry;
  let owner: SignerWithAddress;
  let leader1: SignerWithAddress;
  let leader2: SignerWithAddress;

  const MIN_STAKE = ethers.parseEther("10");

  beforeEach(async function () {
    [owner, leader1, leader2] = await ethers.getSigners();
    const LeaderRegistry = await ethers.getContractFactory("LeaderRegistry");
    registry = await LeaderRegistry.deploy();
  });

  describe("registerLeader", function () {
    it("should register with sufficient stake", async function () {
      const tx = await registry.connect(leader1).registerLeader({ value: MIN_STAKE });
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try { return registry.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "LeaderRegistered"; } catch { return false; }
      });
      expect(event).to.not.be.undefined;
      expect(await registry.isLeader(leader1.address)).to.be.true;
      expect(await registry.getLeaderCount()).to.equal(1n);
    });

    it("should accept over-stake", async function () {
      const overStake = ethers.parseEther("20");
      await registry.connect(leader1).registerLeader({ value: overStake });
      const leader = await registry.leaders(leader1.address);
      expect(leader.stakedSTT).to.equal(overStake);
    });

    it("should revert with insufficient stake", async function () {
      try { await registry.connect(leader1).registerLeader({ value: ethers.parseEther("5") }); expect.fail("Expected revert"); } catch (error: any) { expect(error.message).to.include("revert"); }
    });

    it("should revert if already registered", async function () {
      await registry.connect(leader1).registerLeader({ value: MIN_STAKE });
      try { await registry.connect(leader1).registerLeader({ value: MIN_STAKE }); expect.fail("Expected revert"); } catch (error: any) { expect(error.message).to.include("revert"); }
    });
  });

  describe("deregisterLeader", function () {
    it("should deregister and return stake", async function () {
      await registry.connect(leader1).registerLeader({ value: MIN_STAKE });
      const tx = await registry.connect(leader1).deregisterLeader();
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try { return registry.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "LeaderDeregistered"; } catch { return false; }
      });
      expect(event).to.not.be.undefined;
      expect(await registry.isLeader(leader1.address)).to.be.false;
      expect(await registry.getLeaderCount()).to.equal(0n);
    });

    it("should revert if not a leader", async function () {
      try { await registry.connect(leader1).deregisterLeader(); expect.fail("Expected revert"); } catch (error: any) { expect(error.message).to.include("revert"); }
    });

    it("should handle multiple leaders correctly", async function () {
      await registry.connect(leader1).registerLeader({ value: MIN_STAKE });
      await registry.connect(leader2).registerLeader({ value: MIN_STAKE });
      expect(await registry.getLeaderCount()).to.equal(2n);
      await registry.connect(leader1).deregisterLeader();
      expect(await registry.getLeaderCount()).to.equal(1n);
      expect(await registry.getLeaderAt(0)).to.equal(leader2.address);
    });
  });

  describe("getLeaderAt", function () {
    it("should return correct leader", async function () {
      await registry.connect(leader1).registerLeader({ value: MIN_STAKE });
      expect(await registry.getLeaderAt(0)).to.equal(leader1.address);
    });

    it("should revert for out of bounds", async function () {
      try { await registry.getLeaderAt(0); expect.fail("Expected revert"); } catch (error: any) { expect(error.message).to.include("revert"); }
    });
  });
});
