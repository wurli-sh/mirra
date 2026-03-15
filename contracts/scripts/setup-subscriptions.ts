import { createPublicClient, createWalletClient, http, defineChain, parseGwei, keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { SDK } from "@somnia-chain/reactivity";
import * as dotenv from "dotenv";
dotenv.config();

const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Shannon Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: ["https://dream-rpc.somnia.network/"] } },
  testnet: true,
});

const ADDRESSES = {
  simpleDEX: "0x25949a1AFe1bdDEA5822aa8371CdF8E256D498fb" as `0x${string}`,
  mirrorExecutor: "0xaa8404e8Af97C178A9C2FBFce595e283D0C1a47c" as `0x${string}`,
  riskGuardian: "0x5F918046FB4EeAF298631393e9B877dc5149F032" as `0x${string}`,
};

const SIGS = {
  swap: keccak256(toBytes("Swap(address,address,address,uint256,uint256)")),
  mirrorExecuted: keccak256(toBytes("MirrorExecuted(address,address,address,address,uint256,uint256)")),
  mirrorContinue: keccak256(toBytes("MirrorContinue(address,address,address,uint256,uint256,uint256)")),
} as const;

async function main() {
  if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY not set in .env");
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}` as `0x${string}`);
  const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: somniaTestnet, transport: http() });
  const sdk = new SDK({ public: publicClient, wallet: walletClient });

  console.log("Setting up reactive subscriptions...");
  console.log("Account:", account.address);

  console.log("\n--- Sub 1: DEX Swap -> MirrorExecutor ---");
  const sub1 = await sdk.createSoliditySubscription({
    handlerContractAddress: ADDRESSES.mirrorExecutor,
    emitter: ADDRESSES.simpleDEX,
    eventTopics: [SIGS.swap],
    priorityFeePerGas: parseGwei("10"),
    maxFeePerGas: parseGwei("20"),
    gasLimit: 10_000_000n,
    isGuaranteed: true,
    isCoalesced: false,
  });
  console.log("Sub 1 created:", sub1);

  console.log("\n--- Sub 2: MirrorExecuted -> RiskGuardian ---");
  const sub2 = await sdk.createSoliditySubscription({
    handlerContractAddress: ADDRESSES.riskGuardian,
    emitter: ADDRESSES.mirrorExecutor,
    eventTopics: [SIGS.mirrorExecuted],
    priorityFeePerGas: parseGwei("2"),
    maxFeePerGas: parseGwei("10"),
    gasLimit: 3_000_000n,
    isGuaranteed: true,
    isCoalesced: false,
  });
  console.log("Sub 2 created:", sub2);

  console.log("\n--- Sub 3: MirrorContinue -> MirrorExecutor ---");
  const sub3 = await sdk.createSoliditySubscription({
    handlerContractAddress: ADDRESSES.mirrorExecutor,
    emitter: ADDRESSES.mirrorExecutor,
    eventTopics: [SIGS.mirrorContinue],
    priorityFeePerGas: parseGwei("10"),
    maxFeePerGas: parseGwei("20"),
    gasLimit: 10_000_000n,
    isGuaranteed: true,
    isCoalesced: false,
  });
  console.log("Sub 3 created:", sub3);

  console.log("\n========================================");
  console.log("  Reactive Subscriptions Set Up!");
  console.log("  Min STT balance: 32 STT (subscription owner)");
  console.log("========================================");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
