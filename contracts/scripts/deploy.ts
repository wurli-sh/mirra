import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "STT");

  console.log("\n--- Deploying Tokens ---");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const stt = await MockERC20.deploy("Somnia Test Token", "STT");
  await stt.waitForDeployment();
  console.log("STT Token:", await stt.getAddress());

  const usdc = await MockERC20.deploy("USD Coin", "USDC");
  await usdc.waitForDeployment();
  console.log("USDC Token:", await usdc.getAddress());

  const weth = await MockERC20.deploy("Wrapped ETH", "WETH");
  await weth.waitForDeployment();
  console.log("WETH Token:", await weth.getAddress());

  console.log("\n--- Deploying SimpleDEX ---");
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const dex = await SimpleDEX.deploy();
  await dex.waitForDeployment();
  console.log("SimpleDEX:", await dex.getAddress());

  console.log("\n--- Deploying LeaderRegistry ---");
  const LeaderRegistry = await ethers.getContractFactory("LeaderRegistry");
  const registry = await LeaderRegistry.deploy();
  await registry.waitForDeployment();
  console.log("LeaderRegistry:", await registry.getAddress());

  console.log("\n--- Deploying FollowerVault ---");
  const FollowerVault = await ethers.getContractFactory("FollowerVault");
  const vault = await FollowerVault.deploy(await registry.getAddress(), await stt.getAddress());
  await vault.waitForDeployment();
  console.log("FollowerVault:", await vault.getAddress());

  console.log("\n--- Deploying PositionTracker ---");
  const PositionTracker = await ethers.getContractFactory("PositionTracker");
  const posTracker = await PositionTracker.deploy(await dex.getAddress(), await stt.getAddress());
  await posTracker.waitForDeployment();
  console.log("PositionTracker:", await posTracker.getAddress());

  console.log("\n--- Deploying ReputationEngine ---");
  const ReputationEngine = await ethers.getContractFactory("ReputationEngine");
  const repEngine = await ReputationEngine.deploy();
  await repEngine.waitForDeployment();
  console.log("ReputationEngine:", await repEngine.getAddress());

  console.log("\n--- Deploying MirrorExecutor (REACTIVE) ---");
  const MirrorExecutor = await ethers.getContractFactory("MirrorExecutor");
  const executor = await MirrorExecutor.deploy(
    await dex.getAddress(), await registry.getAddress(), await vault.getAddress(),
    await posTracker.getAddress(), await repEngine.getAddress()
  );
  await executor.waitForDeployment();
  console.log("MirrorExecutor:", await executor.getAddress());

  console.log("\n--- Deploying RiskGuardian (REACTIVE) ---");
  const RiskGuardian = await ethers.getContractFactory("RiskGuardian");
  const guardian = await RiskGuardian.deploy(
    await vault.getAddress(), await posTracker.getAddress(), await repEngine.getAddress()
  );
  await guardian.waitForDeployment();
  console.log("RiskGuardian:", await guardian.getAddress());

  console.log("\n--- Setting Access Controls ---");
  await dex.setAuthorizedSwapper(await executor.getAddress(), true);
  await vault.setMirrorExecutor(await executor.getAddress());
  await vault.setRiskGuardian(await guardian.getAddress());
  await posTracker.setAuthorized(await executor.getAddress(), true);
  await posTracker.setAuthorized(await guardian.getAddress(), true);
  await repEngine.setAuthorized(await executor.getAddress(), true);
  await repEngine.setAuthorized(await guardian.getAddress(), true);
  console.log("Access controls set");

  console.log("\n--- Adding Liquidity ---");
  const LIQUIDITY = ethers.parseEther("1000");  // 1000 per side — demo pool
  await stt.mint(deployer.address, LIQUIDITY * 3n);
  await usdc.mint(deployer.address, LIQUIDITY * 2n);
  await weth.mint(deployer.address, LIQUIDITY);
  await stt.approve(await dex.getAddress(), ethers.MaxUint256);
  await usdc.approve(await dex.getAddress(), ethers.MaxUint256);
  await weth.approve(await dex.getAddress(), ethers.MaxUint256);
  await dex.addLiquidity(await stt.getAddress(), await usdc.getAddress(), LIQUIDITY, LIQUIDITY);
  await dex.addLiquidity(await stt.getAddress(), await weth.getAddress(), LIQUIDITY, LIQUIDITY);
  console.log("Liquidity added: 1000 STT / 1000 USDC, 1000 STT / 1000 WETH");

  console.log("\n========================================");
  console.log("       MirrorX Deployment Summary");
  console.log("========================================");
  console.log(`STT Token:        ${await stt.getAddress()}`);
  console.log(`USDC Token:       ${await usdc.getAddress()}`);
  console.log(`WETH Token:       ${await weth.getAddress()}`);
  console.log(`SimpleDEX:        ${await dex.getAddress()}`);
  console.log(`LeaderRegistry:   ${await registry.getAddress()}`);
  console.log(`FollowerVault:    ${await vault.getAddress()}`);
  console.log(`PositionTracker:  ${await posTracker.getAddress()}`);
  console.log(`ReputationEngine: ${await repEngine.getAddress()}`);
  console.log(`MirrorExecutor:   ${await executor.getAddress()} [REACTIVE]`);
  console.log(`RiskGuardian:     ${await guardian.getAddress()} [REACTIVE]`);
  console.log("========================================");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
