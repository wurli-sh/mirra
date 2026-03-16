import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Load root .env for VITE_* contract addresses
dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });

async function main() {
  const [deployer, leader1, leader2, follower1, follower2, follower3, follower4] = await ethers.getSigners();

  const ADDRESSES = {
    stt: process.env.VITE_STT_TOKEN ?? "",
    usdc: process.env.VITE_USDC_TOKEN ?? "",
    dex: process.env.VITE_SIMPLE_DEX ?? "",
    registry: process.env.VITE_LEADER_REGISTRY ?? "",
    vault: process.env.VITE_FOLLOWER_VAULT ?? "",
  };

  // Validate all addresses are set
  for (const [name, addr] of Object.entries(ADDRESSES)) {
    if (!addr || addr === "0x...") throw new Error(`Missing address for ${name} — set VITE_* env vars`);
  }

  console.log("Seeding data with deployer:", deployer.address);

  const registry = await ethers.getContractAt("LeaderRegistry", ADDRESSES.registry);
  const vault = await ethers.getContractAt("FollowerVault", ADDRESSES.vault);
  const dex = await ethers.getContractAt("SimpleDEX", ADDRESSES.dex);
  const stt = await ethers.getContractAt("MockERC20", ADDRESSES.stt);

  console.log("\n--- Registering Leaders ---");
  const LEADER_STAKE = ethers.parseEther("10");
  await registry.connect(leader1).registerLeader({ value: LEADER_STAKE });
  console.log("Leader 1 registered:", leader1.address);
  await registry.connect(leader2).registerLeader({ value: LEADER_STAKE });
  console.log("Leader 2 registered:", leader2.address);

  console.log("\n--- Creating Follower Positions ---");
  const DEPOSIT = ethers.parseEther("50");
  const MAX_PER_TRADE = ethers.parseEther("10");
  const SLIPPAGE_BPS = 300;
  const STOP_LOSS = ethers.parseEther("15");

  // Mint and approve base tokens for followers
  for (const f of [follower1, follower2, follower3, follower4]) {
    await stt.mint(f.address, DEPOSIT);
    await stt.connect(f).approve(ADDRESSES.vault, DEPOSIT);
  }

  await vault.connect(follower1).follow(leader1.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
  await vault.connect(follower2).follow(leader1.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
  await vault.connect(follower3).follow(leader2.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
  await vault.connect(follower4).follow(leader2.address, DEPOSIT, MAX_PER_TRADE, SLIPPAGE_BPS, STOP_LOSS);
  console.log("4 followers created");

  console.log("\n--- Executing Leader Swap ---");
  const SWAP_AMOUNT = ethers.parseEther("100");
  await stt.mint(leader1.address, SWAP_AMOUNT);
  await stt.connect(leader1).approve(ADDRESSES.dex, SWAP_AMOUNT);
  const tx = await dex.connect(leader1).swap(ADDRESSES.stt, ADDRESSES.usdc, SWAP_AMOUNT, 0);
  const receipt = await tx.wait();
  console.log("Leader 1 swapped 100 STT -> USDC, gas:", receipt?.gasUsed.toString());

  console.log("\n========================================");
  console.log("  Seed Data Complete!");
  console.log("========================================");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
