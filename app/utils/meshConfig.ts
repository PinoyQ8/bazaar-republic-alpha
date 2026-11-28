// Location: /app/utils/meshConfig.ts

export type DeploymentMode = "SOLOHOST" | "VERCEL";
export type NetworkMode = "TESTNET" | "MAINNET";

// 🏛️ CENTRAL PROTOCOL & RELEASE VERSION MATRIX
export const APP_RELEASE_VERSION = "0.2.0";
export const MESH_PROTOCOL_VERSION = "2.8.0";
export const NEO_PROTOCOL_VERSION = "1.2.0";
export const PROTOCOL_HORIZON = "28";

const DEFAULT_TESTNET_RPC_URL = "https://rpc.testnet.minepi.com";
const DEFAULT_TESTNET_SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
const DEFAULT_TESTNET_PASSPHRASE = "Pi Testnet";
const DEFAULT_TESTNET_STELLAR_PASSPHRASE = "Test SDF Network ; September 2015";
const DEFAULT_TESTNET_CONTRACT_ID =
  "CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ";
const DEFAULT_TESTNET_VAULT_CONTRACT_ID =
  "CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV";

export interface MasterMeshConfig {
  deployment: DeploymentMode;
  network: NetworkMode;
  appVersion: string;
  protocolVersion: string;
  neoVersion: string;
  protocolHorizon: string;
  apiBaseUrl: string;
  rpcUrl: string;
  networkPassphrase: string;
  sorobanRpcUrl: string;
  stellarPassphrase: string;
  contractId: string;
  vaultContractId: string;
  isSandbox: boolean;
}

function normalizeNetwork(raw?: string | null): NetworkMode {
  return raw && raw.trim().toUpperCase().includes("MAINNET")
    ? "MAINNET"
    : "TESTNET";
}

function normalizeDeployment(raw?: string | null): DeploymentMode {
  const upper = raw?.trim().toUpperCase();
  return upper === "VERCEL" ? "VERCEL" : "SOLOHOST";
}

/**
 * 🛡️ Retrieves the authoritative Master MESH configuration with SSR safety
 */
export function getMasterMeshConfig(): MasterMeshConfig {
  const envSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === "true";

  // Server-side default baseline (SSR safe)
  if (typeof window === "undefined") {
    return {
      deployment: "VERCEL",
      network: "TESTNET",
      appVersion: APP_RELEASE_VERSION,
      protocolVersion: MESH_PROTOCOL_VERSION,
      neoVersion: NEO_PROTOCOL_VERSION,
      protocolHorizon: PROTOCOL_HORIZON,
      apiBaseUrl: "",
      rpcUrl: process.env.NEXT_PUBLIC_PI_RPC_URL || DEFAULT_TESTNET_RPC_URL,
      networkPassphrase:
        process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE ||
        DEFAULT_TESTNET_PASSPHRASE,
      sorobanRpcUrl:
        process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
        DEFAULT_TESTNET_SOROBAN_RPC_URL,
      stellarPassphrase:
        process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
        DEFAULT_TESTNET_STELLAR_PASSPHRASE,
      contractId:
        process.env.NEXT_PUBLIC_MESH_CONTRACT_ID ||
        DEFAULT_TESTNET_CONTRACT_ID,
      vaultContractId:
        process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID ||
        DEFAULT_TESTNET_VAULT_CONTRACT_ID,
      isSandbox: envSandbox,
    };
  }

  // Client-side local storage preference detection
  const deployment = normalizeDeployment(
    window.localStorage.getItem("mesh_deployment_mode")
  );
  const storedNetwork =
    window.localStorage.getItem("mesh_network_mode") ||
    window.localStorage.getItem("mesh_ledger_protocol");
  const network = normalizeNetwork(storedNetwork);

  // Dynamic API routing based on active deployment host
  const apiBaseUrl =
    deployment === "SOLOHOST"
      ? (process.env.NEXT_PUBLIC_SOLOHOST_URL || "http://localhost:3000").trim()
      : "";

  // Dynamic blockchain parameters based on active network tier
  const rpcUrl =
    network === "MAINNET"
      ? (
          process.env.NEXT_PUBLIC_PI_MAINNET_RPC_URL ||
          "https://rpc.minepi.com"
        ).trim()
      : (
          process.env.NEXT_PUBLIC_PI_RPC_URL || DEFAULT_TESTNET_RPC_URL
        ).trim();

  const networkPassphrase =
    network === "MAINNET"
      ? (
          process.env.NEXT_PUBLIC_PI_MAINNET_PASSPHRASE || "Pi Network"
        ).trim()
      : (
          process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE ||
          DEFAULT_TESTNET_PASSPHRASE
        ).trim();

  const sorobanRpcUrl =
    network === "MAINNET"
      ? (
          process.env.NEXT_PUBLIC_SOROBAN_MAINNET_RPC_URL ||
          "https://mainnet.sorobanrpc.com"
        ).trim()
      : (
          process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
          DEFAULT_TESTNET_SOROBAN_RPC_URL
        ).trim();

  const stellarPassphrase =
    network === "MAINNET"
      ? (
          process.env.NEXT_PUBLIC_STELLAR_MAINNET_PASSPHRASE ||
          "Public Global Stellar Network ; July 2015"
        ).trim()
      : (
          process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
          DEFAULT_TESTNET_STELLAR_PASSPHRASE
        ).trim();

  const contractId =
    network === "MAINNET"
      ? (process.env.NEXT_PUBLIC_MESH_MAINNET_CONTRACT_ID || "").trim()
      : (
          process.env.NEXT_PUBLIC_MESH_CONTRACT_ID ||
          DEFAULT_TESTNET_CONTRACT_ID
        ).trim();

  const vaultContractId =
    network === "MAINNET"
      ? (process.env.NEXT_PUBLIC_BAZAAR_VAULT_MAINNET_CONTRACT_ID || "").trim()
      : (
          process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
          process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID ||
          DEFAULT_TESTNET_VAULT_CONTRACT_ID
        ).trim();

  return {
    deployment,
    network,
    appVersion: APP_RELEASE_VERSION,
    protocolVersion: MESH_PROTOCOL_VERSION,
    neoVersion: NEO_PROTOCOL_VERSION,
    protocolHorizon: PROTOCOL_HORIZON,
    apiBaseUrl,
    rpcUrl,
    networkPassphrase,
    sorobanRpcUrl,
    stellarPassphrase,
    contractId,
    vaultContractId,
    isSandbox: envSandbox,
  };
}