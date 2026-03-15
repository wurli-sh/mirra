import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleDEX, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleDEX", function () {
  let dex: SimpleDEX;
  let tokenA: MockERC20;
  let tokenB: MockERC20;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let executor: SignerWithAddress;

  const LIQUIDITY = ethers.parseEther("10000");
  const SWAP_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, user, executor] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    tokenB = await MockERC20.deploy("Token B", "TKB");

    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy();

    await tokenA.mint(owner.address, LIQUIDITY * 2n);
    await tokenB.mint(owner.address, LIQUIDITY * 2n);
    await tokenA.connect(owner).approve(await dex.getAddress(), ethers.MaxUint256);
    await tokenB.connect(owner).approve(await dex.getAddress(), ethers.MaxUint256);

    await dex.addLiquidity(await tokenA.getAddress(), await tokenB.getAddress(), LIQUIDITY, LIQUIDITY);

    await tokenA.mint(user.address, SWAP_AMOUNT * 10n);
    await tokenA.connect(user).approve(await dex.getAddress(), ethers.MaxUint256);
  });

  describe("addLiquidity", function () {
    it("should add liquidity and update reserves", async function () {
      const [resA, resB] = await dex.getReserves(await tokenA.getAddress(), await tokenB.getAddress());
      expect(resA).to.equal(LIQUIDITY);
      expect(resB).to.equal(LIQUIDITY);
    });

    it("should revert for same token", async function () {
      try {
        await dex.addLiquidity(await tokenA.getAddress(), await tokenA.getAddress(), 100, 100);
        expect.fail("Expected revert");
      } catch (error: any) {
        expect(error.message).to.include("Same token");
      }
    });
  });

  describe("swap", function () {
    it("should swap tokens with 0.3% fee", async function () {
      const expectedOut = await dex.getAmountOut(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT);
      expect(expectedOut > 0n).to.be.true;

      const tx = await dex.connect(user).swap(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT, 0);
      const receipt = await tx.wait();
      const swapEvent = receipt?.logs.find((log) => {
        try {
          return dex.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "Swap";
        } catch { return false; }
      });
      expect(swapEvent).to.not.be.undefined;
      const parsed = dex.interface.parseLog({ topics: swapEvent!.topics as string[], data: swapEvent!.data });
      expect(parsed?.args[0]).to.equal(user.address);
      expect(parsed?.args[3]).to.equal(SWAP_AMOUNT);
      expect(parsed?.args[4]).to.equal(expectedOut);
    });

    it("should revert on slippage exceeded", async function () {
      try {
        await dex.connect(user).swap(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT, ethers.parseEther("999"));
        expect.fail("Expected revert");
      } catch (error: any) {
        expect(error.message).to.include("Slippage exceeded");
      }
    });

    it("should revert for same token", async function () {
      try {
        await dex.connect(user).swap(await tokenA.getAddress(), await tokenA.getAddress(), SWAP_AMOUNT, 0);
        expect.fail("Expected revert");
      } catch (error: any) {
        expect(error.message).to.include("Same token");
      }
    });
  });

  describe("swapFor", function () {
    it("should revert if caller is not authorized", async function () {
      try {
        await dex.connect(user).swapFor(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT, 0, user.address, user.address);
        expect.fail("Expected revert");
      } catch (error: any) {
        expect(error.message).to.include("Not authorized");
      }
    });

    it("should swap on behalf when authorized", async function () {
      await dex.setAuthorizedSwapper(executor.address, true);
      await tokenA.mint(executor.address, SWAP_AMOUNT);
      await tokenA.connect(executor).approve(await dex.getAddress(), ethers.MaxUint256);

      const expectedOut = await dex.getAmountOut(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT);
      const tx = await dex.connect(executor).swapFor(await tokenA.getAddress(), await tokenB.getAddress(), SWAP_AMOUNT, 0, executor.address, user.address);
      const receipt = await tx.wait();
      const swapEvent = receipt?.logs.find((log) => {
        try {
          return dex.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "Swap";
        } catch { return false; }
      });
      expect(swapEvent).to.not.be.undefined;

      const userBalance = await tokenB.balanceOf(user.address);
      expect(userBalance).to.equal(expectedOut);
    });
  });

  describe("removeLiquidity", function () {
    it("should remove liquidity and return proportional tokens", async function () {
      const t0 = await tokenA.getAddress();
      const t1 = await tokenB.getAddress();
      const [sorted0, sorted1] = t0.toLowerCase() < t1.toLowerCase() ? [t0, t1] : [t1, t0];
      const pairKey = ethers.solidityPackedKeccak256(["address", "address"], [sorted0, sorted1]);

      const shares = await dex.providerShares(pairKey, owner.address);
      expect(shares > 0n).to.be.true;

      const balABefore = await tokenA.balanceOf(owner.address);
      const balBBefore = await tokenB.balanceOf(owner.address);

      await dex.connect(owner).removeLiquidity(t0, t1, shares);

      const balAAfter = await tokenA.balanceOf(owner.address);
      const balBAfter = await tokenB.balanceOf(owner.address);

      expect(balAAfter - balABefore).to.equal(LIQUIDITY);
      expect(balBAfter - balBBefore).to.equal(LIQUIDITY);

      const [resA, resB] = await dex.getReserves(t0, t1);
      expect(resA).to.equal(0n);
      expect(resB).to.equal(0n);
    });

    it("should remove partial liquidity", async function () {
      const t0 = await tokenA.getAddress();
      const t1 = await tokenB.getAddress();
      const [sorted0, sorted1] = t0.toLowerCase() < t1.toLowerCase() ? [t0, t1] : [t1, t0];
      const pairKey = ethers.solidityPackedKeccak256(["address", "address"], [sorted0, sorted1]);

      const shares = await dex.providerShares(pairKey, owner.address);
      const halfShares = shares / 2n;

      await dex.connect(owner).removeLiquidity(t0, t1, halfShares);

      const [resA, resB] = await dex.getReserves(t0, t1);
      expect(resA).to.equal(LIQUIDITY / 2n);
      expect(resB).to.equal(LIQUIDITY / 2n);
    });

    it("should revert with insufficient shares", async function () {
      const t0 = await tokenA.getAddress();
      const t1 = await tokenB.getAddress();
      const [sorted0, sorted1] = t0.toLowerCase() < t1.toLowerCase() ? [t0, t1] : [t1, t0];
      const pairKey = ethers.solidityPackedKeccak256(["address", "address"], [sorted0, sorted1]);
      const shares = await dex.providerShares(pairKey, owner.address);
      try {
        await dex.connect(owner).removeLiquidity(t0, t1, shares + 1n);
        expect.fail("Expected revert");
      } catch (error: any) {
        expect(error.message).to.include("Insufficient shares");
      }
    });

    it("should revert for same token", async function () {
      const t0 = await tokenA.getAddress();
      try {
        await dex.connect(owner).removeLiquidity(t0, t0, 100n);
        expect.fail("Expected revert");
      } catch (error: any) {
        expect(error.message).to.include("Same token");
      }
    });
  });

  describe("getAmountOut", function () {
    it("should return correct output with AMM formula", async function () {
      const amountIn = ethers.parseEther("100");
      const amountInWithFee = amountIn * 997n;
      const expected = (amountInWithFee * LIQUIDITY) / (LIQUIDITY * 1000n + amountInWithFee);
      const result = await dex.getAmountOut(await tokenA.getAddress(), await tokenB.getAddress(), amountIn);
      expect(result).to.equal(expected);
    });

    it("should revert with no liquidity", async function () {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const tokenC = await MockERC20.deploy("Token C", "TKC");
      try {
        await dex.getAmountOut(await tokenA.getAddress(), await tokenC.getAddress(), SWAP_AMOUNT);
        expect.fail("Expected revert");
      } catch (error: any) {
        expect(error.message).to.include("No liquidity");
      }
    });
  });
});
