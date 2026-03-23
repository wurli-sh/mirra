import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Load root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });

async function main() {
  const [deployer] = await ethers.getSigners();

  const sttAddr = process.env.VITE_STT_TOKEN ?? "";
  const usdcAddr = process.env.VITE_USDC_TOKEN ?? "";
  const dexAddr = process.env.VITE_SIMPLE_DEX ?? "";

  if (!sttAddr || !usdcAddr || !dexAddr) throw new Error("Missing contract addresses");

  const stt = await ethers.getContractAt("MockERC20", sttAddr);
  const dex = await ethers.getContractAt("SimpleDEX", dexAddr);

  // Check current pool state
  const [reserveSTT, reserveUSDC] = await dex.getReserves(sttAddr, usdcAddr);
  console.log(`Pool before: ${ethers.formatEther(reserveSTT)} STT / ${ethers.formatEther(reserveUSDC)} USDC`);

  // Whale dumps 200 STT → USDC (moves price ~20% on 1000/1000 pool)
  const WHALE_AMOUNT = ethers.parseEther("200");
  await stt.mint(deployer.address, WHALE_AMOUNT);
  await stt.approve(dexAddr, WHALE_AMOUNT);
  const tx = await dex.swap(sttAddr, usdcAddr, WHALE_AMOUNT, 0);
  await tx.wait();

  const [reserveSTT2, reserveUSDC2] = await dex.getReserves(sttAddr, usdcAddr);
  const ratio = Number(reserveSTT2) / Number(reserveUSDC2);
  console.log(`Pool after:  ${ethers.formatEther(reserveSTT2)} STT / ${ethers.formatEther(reserveUSDC2)} USDC`);
  console.log(`1 USDC ≈ ${ratio.toFixed(2)} STT`);
  console.log("\nPrice moved! Leader can now swap USDC → STT for profit.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
