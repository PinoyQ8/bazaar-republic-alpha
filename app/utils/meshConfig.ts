// Location: /app/utils/meshConfig.ts

export type DeploymentMode = "SOLOHOST" | "VERCEL";
export type NetworkMode = "TESTNET" | "MAINNET";

// 🏛️ CENTRAL PROTOCOL VERSION MATRIX
export const MESH_PROTOCOL_VERSION = "2.8.0";
export const NEO_PROTOCOL_VERSION = "1.2.0";
export const PROTOCOL_HORIZON = "28";

export interface MasterMeshConfig {
  deployment: DeploymentMode;
  network: NetworkMode;
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

/**
 * 🛡️ Retrieves the authoritative Master MESH configuration with SSR safety
 */
export function getMasterMeshConfig(): MasterMeshConfig {
  const isServer = typeof window === "undefined";

  // Server-side default baseline (SSR safe)
  if (isServer) {
    return {
      deployment: "VERCEL",
      network: "TESTNET",
      protocolVersion: MESH_PROTOCOL_VERSION,
      neoVersion: NEO_PROTOCOL_VERSION,
      protocolHorizon: PROTOCOL_HORIZON,
      apiBaseUrl: "",
      rpcUrl: process.env.NEXT_PUBLIC_PI_RPC_URL || "https://rpc.testnet.minepi.com",
      networkPassphrase: process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE || "Pi Testnet",
      sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
      stellarPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
      contractId: process.env.NEXT_PUBLIC_MESH_CONTRACT_ID || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      vaultContractId: process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID || process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID || "CCLEEATNMEUZGVSYL4NSZYADVCAPU2EFCJNCNV77KVOUDFO3CGM3SKKL",
      isSandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === "true",
    };
  }

  // Client-side local storage detection
  const deployment = (localStorage.getItem("mesh_deployment_mode") as DeploymentMode) || "SOLOHOST";
  
  const storedNetwork = localStorage.getItem("mesh_network_mode") || localStorage.getItem("mesh_ledger_protocol");
  const network: NetworkMode = (storedNetwork && storedNetwork.toUpperCase().includes("MAINNET")) 
    ? "MAINNET" 
    : "TESTNET";

  // Dynamic API routing based on active deployment host
  const apiBaseUrl = deployment === "SOLOHOST" 
    ? (process.env.NEXT_PUBLIC_SOLOHOST_URL || "http://localhost:3000") 
    : ""; // Empty string uses relative paths on Vercel Edge

  // Dynamic blockchain parameters based on active network tier
  const rpcUrl = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_PI_MAINNET_RPC_URL || "https://rpc.minepi.com")
    : (process.env.NEXT_PUBLIC_PI_RPC_URL || "https://rpc.testnet.minepi.com");

  const networkPassphrase = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_PI_MAINNET_PASSPHRASE || "Pi Network")
    : (process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE || "Pi Testnet");

  const sorobanRpcUrl = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_SOROBAN_MAINNET_RPC_URL || "https://mainnet.sorobanrpc.com")
    : (process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org");

  const stellarPassphrase = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_STELLAR_MAINNET_PASSPHRASE || "Public Global Stellar Network ; July 2015")
    : (process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015");

  const contractId = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_MESH_MAINNET_CONTRACT_ID || "")
    : (process.env.NEXT_PUBLIC_MESH_CONTRACT_ID || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC");

  const vaultContractId = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_BAZAAR_VAULT_MAINNET_CONTRACT_ID || "")
    : (process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID || process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID || "CCLEEATNMEUZGVSYL4NSZYADVCAPU2EFCJNCNV77KVOUDFO3CGM3SKKL");

  return {
    deployment,
    network,
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
    isSandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === "true",
  };
}