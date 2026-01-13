// app/Velorin.mjs
// Built for Base - Base Sepolia only (chainId 84532)
// Read-only inspector: connects to Coinbase Wallet, reads balances, block + fee data, checks bytecode, prints Basescan links

import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  hexToBigInt,
  http,
  isAddress,
  parseEther,
} from "viem";
import { baseSepolia } from "viem/chains";

/**
 * Constants - Base Sepolia
 */
const CHAIN_ID = 84532;
const BASESCAN = "https://sepolia.basescan.org";
const DEFAULT_RPC = "https://sepolia.base.org";

/**
 * Small utilities
 */
function nowIso() {
  return new Date().toISOString();
}

function shortAddr(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function basescanAddressLink(address) {
  return `${BASESCAN}/address/${address}`;
}

function basescanBlockLink(blockNumber) {
  return `${BASESCAN}/block/${blockNumber}`;
}

function basescanTxLink(hash) {
  return `${BASESCAN}/tx/${hash}`;
}

function basescanTokenLink(tokenAddress) {
  return `${BASESCAN}/token/${tokenAddress}`;
}

function safeBigintToGwei(value) {
  const gwei = Number(value) / 1e9;
  if (!Number.isFinite(gwei)) return String(value);
  return `${gwei.toFixed(3)} gwei`;
}

function makeEmitter() {
  const lines = [];
  const hasDom = typeof document !== "undefined" && document?.body;

  const emit = (line = "") => {
    lines.push(line);
    if (hasDom) {
      const pre = document.getElementById("velorin-output") || (() => {
        const el = document.createElement("pre");
        el.id = "velorin-output";
        el.style.whiteSpace = "pre-wrap";
        el.style.wordBreak = "break-word";
        el.style.padding = "16px";
        el.style.border = "1px solid #ddd";
        el.style.borderRadius = "8px";
        el.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        document.body.appendChild(el);
        return el;
      })();
      pre.textContent = lines.join("\n");
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  };

  return { emit, dump: () => lines.join("\n") };
}

/**
 * Coinbase Wallet SDK - create an EIP-1193 provider for Base Sepolia
 */
function createCoinbaseProvider({ appName, appLogoUrl, rpcUrl }) {
  const sdk = new CoinbaseWalletSDK({
    appName,
    appLogoUrl,
    darkMode: false,
    overrideIsMetaMask: false,
    overrideIsCoinbaseWallet: true,
  });

  // Make provider with explicit chainId, RPC URL
  const provider = sdk.makeWeb3Provider(rpcUrl, CHAIN_ID);

  return provider;
}

/**
 * viem clients
 */
function createClients({ provider, rpcUrl }) {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    chain: baseSepolia,
    transport: custom(provider),
  });

  return { publicClient, walletClient };
}

/**
 * Read-only: connect wallet (request accounts) - does not sign anything
 */
async function connectWallet(walletClient, emit) {
  emit(`time: ${nowIso()}`);
  emit(`network: Base Sepolia (chainId ${CHAIN_ID})`);
  emit(`explorer: ${BASESCAN}`);
  emit("");

  const chainId = await walletClient.getChainId();
  emit(`wallet chainId: ${chainId}`);

  if (Number(chainId) !== CHAIN_ID) {
    emit("warning: wallet is not on Base Sepolia - data reads will still use Base Sepolia public RPC");
  }

  const addresses = await walletClient.getAddresses();
  if (!addresses?.length) {
    throw new Error("no addresses returned by wallet");
  }

  emit(`wallet connected: ${addresses.length} address(es)`);
  addresses.forEach((a, i) => emit(`- [${i}] ${a} (${basescanAddressLink(a)})`));
  emit("");

  return addresses;
}

/**
 * Read-only: fetch balance(s)
 */
async function readBalances(publicClient, addresses, emit) {
  emit("balances:");
  for (const addr of addresses) {
    const bal = await publicClient.getBalance({ address: addr });
    emit(`- ${shortAddr(addr)}: ${formatEther(bal)} ETH - ${basescanAddressLink(addr)}`);
  }
  emit("");
}

/**
 * Read-only: block + fee data
 */
async function readBlockAndGas(publicClient, emit) {
  const blockNumber = await publicClient.getBlockNumber();
  const block = await publicClient.getBlock({ blockNumber });

  emit("chain data:");
  emit(`- latest block: ${blockNumber.toString()} - ${basescanBlockLink(blockNumber.toString())}`);
  emit(`- timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);

  const gasPrice = await publicClient.getGasPrice();
  emit(`- gas price: ${safeBigintToGwei(gasPrice)}`);

  // baseFeePerGas exists on EIP-1559 chains
  if (block.baseFeePerGas != null) {
    emit(`- base fee: ${safeBigintToGwei(block.baseFeePerGas)}`);
  } else {
    emit(`- base fee: not available on this block response`);
  }

  // Fee history is read-only and helps understand recent fee volatility
  const feeHistory = await publicClient.getFeeHistory({
    blockCount: 6,
    rewardPercentiles: [10, 50, 90],
  });

  emit(`- fee history: ${feeHistory.baseFeePerGas.length} baseFee points`);
  emit(`- oldest block in history: ${feeHistory.oldestBlock.toString()}`);
  emit("");
}

/**
 * Read-only: check if bytecode exists at addresses
 */
async function checkBytecode(publicClient, targets, emit) {
  emit("bytecode checks:");
  for (const t of targets) {
    if (!isAddress(t)) {
      emit(`- invalid address skipped: ${t}`);
      continue;
    }
    const code = await publicClient.getBytecode({ address: t });
    const exists = !!code && code !== "0x";
    emit(`- ${shortAddr(t)}: ${exists ? "contract bytecode found" : "no bytecode (EOA or not deployed)"} - ${basescanAddressLink(t)}`);
  }
  emit("");
}

/**
 * Optional: token and tx link helpers - read-only printing only
 */
function printUsefulLinks(emit, { sampleToken, sampleTx }) {
  emit("useful basescan links:");
  if (sampleToken && isAddress(sampleToken)) {
    emit(`- token: ${basescanTokenLink(sampleToken)}`);
  }
  if (sampleTx && typeof sampleTx === "string" && sampleTx.startsWith("0x") && sampleTx.length === 66) {
    emit(`- tx: ${basescanTxLink(sampleTx)}`);
  }
  emit(`- blocks: ${BASESCAN}/blocks`);
  emit(`- gas tracker: ${BASESCAN}/gastracker`);
  emit("");
}

/**
 * Main flow:
 * 1) Create Coinbase provider
 * 2) Create viem clients (wallet + public)
 * 3) Connect wallet (addresses)
 * 4) Read balances, block + fee data
 * 5) Check bytecode at curated addresses
 * 6) Print Basescan links
 */
export async function runVelorinInspector(options = {}) {
  const {
    appName = "Velorin",
    appLogoUrl = "https://avatars.githubusercontent.com/u/1885080?s=200&v=4",
    rpcUrl = DEFAULT_RPC,
    bytecodeTargets = [
      // a few placeholder addresses for bytecode checks (replace as desired)
      "0x0000000000000000000000000000000000000000",
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
    ],
    sampleToken = "0x3333333333333333333333333333333333333333",
    sampleTx = "0x4444444444444444444444444444444444444444444444444444444444444444",
  } = options;

  const { emit } = makeEmitter();

  // In Node.js there is no wallet UI - keep script safe and informative
  const hasWindow = typeof window !== "undefined";
  if (!hasWindow) {
    emit("Velorin is designed for a browser environment so Coinbase Wallet can prompt for connection.");
    emit("Tip: run it via a simple dev server or bundler and open in a browser.");
    emit(`Still, Base Sepolia reads can be performed via RPC: ${rpcUrl}`);
    emit("");
  }

  const provider = createCoinbaseProvider({ appName, appLogoUrl, rpcUrl });
  const { publicClient, walletClient } = createClients({ provider, rpcUrl });

  let addresses = [];
  try {
    addresses = await connectWallet(walletClient, emit);
  } catch (err) {
    emit(`wallet connection failed: ${err?.message || String(err)}`);
    emit("continuing with read-only chain data without wallet addresses");
    emit("");
  }

  // Read-only chain data always works via public RPC
  await readBlockAndGas(publicClient, emit);

  if (addresses.length) {
    await readBalances(publicClient, addresses, emit);
  }

  await checkBytecode(publicClient, bytecodeTargets, emit);
  printUsefulLinks(emit, { sampleToken, sampleTx });

  emit("done");
}

/**
 * Auto-run in browser
 */
if (typeof window !== "undefined") {
  window.__velorin = { runVelorinInspector };
  // Run once on load
  runVelorinInspector().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
  });
}

/**
 * Notes:
 * - No transactions are sent
 * - No message signing
 * - No onchain state writes
 * - Reads are performed via Base Sepolia public RPC and wallet address discovery via Coinbase Wallet SDK
 */
