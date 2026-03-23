import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const LEADER = process.env.LEADER_ADDRESS ?? "0xFbc83d9aDA8F06242a528b62A63728e1EF7DE066";
const FOLLOWER = process.env.FOLLOWER_ADDRESS ?? "0x46fD7D09cE6693669C83d41C7212DB1189511e97";

async function main() {
  const stt = await ethers.getContractAt("MockERC20", process.env.VITE_STT_TOKEN!);
  const usdc = await ethers.getContractAt("MockERC20", process.env.VITE_USDC_TOKEN!);
  const weth = await ethers.getContractAt("MockERC20", process.env.VITE_WETH_TOKEN!);

  console.log("--- Minting tokens to Leader ---");
  // Leader already has 1000 STT + 1000 USDC from deploy, mint extra WETH
  await stt.mint(LEADER, ethers.parseEther("500"));
  await usdc.mint(LEADER, ethers.parseEther("500"));
  await weth.mint(LEADER, ethers.parseEther("500"));
  console.log(`Leader (${LEADER}): +500 STT, +500 USDC, +500 WETH`);

  console.log("\n--- Minting tokens to Follower ---");
  await stt.mint(FOLLOWER, ethers.parseEther("200"));
  await usdc.mint(FOLLOWER, ethers.parseEther("100"));
  await weth.mint(FOLLOWER, ethers.parseEther("100"));
  console.log(`Follower (${FOLLOWER}): +200 STT, +100 USDC, +100 WETH`);

  console.log("\n--- Final Balances ---");
  console.log(`Leader  STT: ${ethers.formatEther(await stt.balanceOf(LEADER))}`);
  console.log(`Leader USDC: ${ethers.formatEther(await usdc.balanceOf(LEADER))}`);
  console.log(`Leader WETH: ${ethers.formatEther(await weth.balanceOf(LEADER))}`);
  console.log(`Follower  STT: ${ethers.formatEther(await stt.balanceOf(FOLLOWER))}`);
  console.log(`Follower USDC: ${ethers.formatEther(await usdc.balanceOf(FOLLOWER))}`);
  console.log(`Follower WETH: ${ethers.formatEther(await weth.balanceOf(FOLLOWER))}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
