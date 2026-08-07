// Location: /app/utils/meshConfig.ts
export type DeploymentMode = "SOLOHOST" | "VERCEL";
export type NetworkMode = "TESTNET" | "MAINNET";

export interface MasterMeshConfig {
  deployment: DeploymentMode;
  network: NetworkMode;
  apiBaseUrl: string;
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
}

export function getMasterMeshConfig(): MasterMeshConfig {
  if (typeof window === "undefined") {
    return {
      deployment: "VERCEL",
      network: "TESTNET",
      apiBaseUrl: "",
      rpcUrl: process.env.NEXT_PUBLIC_PI_RPC_URL || "https://rpc.testnet.minepi.com",
      networkPassphrase: process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE || "Pi Testnet",
      contractId: process.env.NEXT_PUBLIC_MESH_CONTRACT_ID || "",
    };
  }

  const deployment = (localStorage.getItem("mesh_deployment_mode") as DeploymentMode) || "SOLOHOST";
  const network = (localStorage.getItem("mesh_network_mode") as NetworkMode) || "TESTNET";

  // Dynamic API routing based on active deployment host
  const apiBaseUrl = deployment === "SOLOHOST" 
    ? (process.env.NEXT_PUBLIC_SOLOHOST_URL || "http://localhost:3000") 
    : ""; // Empty string defaults to relative path on Vercel

  // Dynamic blockchain parameters based on active network tier
  const rpcUrl = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_PI_MAINNET_RPC_URL || "https://rpc.mainnet.minepi.com")
    : (process.env.NEXT_PUBLIC_PI_RPC_URL || "https://rpc.testnet.minepi.com");

  const networkPassphrase = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_PI_MAINNET_PASSPHRASE || "Pi Network")
    : (process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE || "Pi Testnet");

  const contractId = network === "MAINNET"
    ? (process.env.NEXT_PUBLIC_MESH_MAINNET_CONTRACT_ID || "")
    : (process.env.NEXT_PUBLIC_MESH_CONTRACT_ID || "");

  return {
    deployment,
    network,
    apiBaseUrl,
    rpcUrl,
    networkPassphrase,
    contractId,
  };
}