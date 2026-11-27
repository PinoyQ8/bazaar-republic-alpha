export type MeshNetwork = "testnet" | "mainnet";
export type AppRealm = "ACADEMY" | "REPUBLIC";

export interface ResolvedMeshEnv {
  network: MeshNetwork;
  realm: AppRealm;
  networkLabel: string;
  sandbox: boolean;
  piApiBaseUrl: string;
  rpcUrl: string;
  networkPassphrase: string;
  /** Server-only Pi Platform API key. Never serialize or send to client components. */
  piApiKey: string;
}

const TESTNET_HOSTS = new Set([
  "bazaarrepublic3496.pinet.com",
  "mesh-academy-alpha.vercel.app",
  "localhost",
  "127.0.0.1",
]);

const MAINNET_HOSTS = new Set([
  "bazaardao6650.pinet.com",
  "project-bazaar-mainnet.vercel.app",
]);

function normalizeHost(rawHost?: string | null): string {
  if (!rawHost) return "";
  return rawHost
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0];
}

export function resolveMeshNetwork(options?: {
  hostOrOrigin?: string | null;
  explicitNetwork?: string | null;
}): MeshNetwork {
  const explicit = options?.explicitNetwork?.trim().toLowerCase();
  if (explicit === "mainnet" || explicit === "main") return "mainnet";
  if (explicit === "testnet" || explicit === "test" || explicit === "sandbox") {
    return "testnet";
  }

  const host = normalizeHost(options?.hostOrOrigin);
  if (MAINNET_HOSTS.has(host)) return "mainnet";
  if (TESTNET_HOSTS.has(host)) return "testnet";

  return process.env.NEXT_PUBLIC_PI_SANDBOX === "false" ? "mainnet" : "testnet";
}

export function getMeshServerEnv(options?: {
  hostOrOrigin?: string | null;
  explicitNetwork?: string | null;
  requireApiKey?: boolean;
}): ResolvedMeshEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "getMeshServerEnv() must only be called on the server—never in browser/client code."
    );
  }

  const network = resolveMeshNetwork(options);
  const isMainnet = network === "mainnet";

  const piApiKey = isMainnet
    ? (
        process.env.PI_MAINNET_API_KEY ||
        (process.env.NEXT_PUBLIC_PI_SANDBOX === "false"
          ? process.env.PI_API_KEY
          : "") ||
        ""
      ).trim()
    : (
        process.env.PI_TESTNET_API_KEY ||
        (process.env.NEXT_PUBLIC_PI_SANDBOX !== "false"
          ? process.env.PI_API_KEY
          : "") ||
        ""
      ).trim();

  if (options?.requireApiKey && !piApiKey) {
    throw new Error(
      `Missing server Pi API key for ${network.toUpperCase()} (${
        isMainnet ? "PI_MAINNET_API_KEY" : "PI_TESTNET_API_KEY"
      }).`
    );
  }

  const rpcUrl = isMainnet
    ? (
        process.env.MAINNET_SOROBAN_RPC_URL ||
        process.env.SOROBAN_RPC_URL ||
        process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
        "https://api.mainnet.minepi.com"
      ).trim()
    : (
        process.env.TESTNET_SOROBAN_RPC_URL ||
        process.env.SOROBAN_RPC_URL ||
        process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
        "https://rpc.testnet.minepi.com"
      ).trim();

  const networkPassphrase = isMainnet
    ? (
        process.env.MAINNET_NETWORK_PASSPHRASE ||
        process.env.STELLAR_NETWORK_PASSPHRASE ||
        process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE ||
        "Pi Mainnet"
      ).trim()
    : (
        process.env.TESTNET_NETWORK_PASSPHRASE ||
        process.env.STELLAR_NETWORK_PASSPHRASE ||
        process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE ||
        "Pi Testnet"
      ).trim();

  const piApiBaseUrl = isMainnet
    ? (
        process.env.PI_MAINNET_API_URL ||
        process.env.PI_API_URL ||
        process.env.NEXT_PUBLIC_PI_API_URL ||
        "https://api.minepi.com/v2"
      ).trim()
    : (
        process.env.PI_TESTNET_API_URL ||
        process.env.PI_API_URL ||
        "https://api.minepi.com/v2"
      ).trim();

  const networkLabel = isMainnet
    ? (
        process.env.NEXT_PUBLIC_MAINNET_NETWORK_LABEL ||
        process.env.NEXT_PUBLIC_NETWORK_LABEL ||
        "Bazaar Republic (Mainnet)"
      ).trim()
    : (
        process.env.NEXT_PUBLIC_TESTNET_NETWORK_LABEL ||
        process.env.NEXT_PUBLIC_NETWORK_LABEL ||
        "MESH Academy (Testnet)"
      ).trim();

  return {
    network,
    realm: isMainnet ? "REPUBLIC" : "ACADEMY",
    networkLabel,
    sandbox: !isMainnet,
    piApiBaseUrl,
    rpcUrl,
    networkPassphrase,
    piApiKey,
  };
}