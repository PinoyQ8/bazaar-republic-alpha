// Location: app/utils/mesh-contracts.ts

export type NetworkMode = "TESTNET" | "MAINNET";

export const MESH_NETWORK_KEYS: Record<NetworkMode, string> = {
  TESTNET: process.env.NEXT_PUBLIC_PI_TESTNET_PUBLIC_KEY || "FtbUB9fO3zfZZG3cp2SEpEdgzTNEgqpliDl8Q7Jr9Nc",
  MAINNET: process.env.NEXT_PUBLIC_PI_MAINNET_PUBLIC_KEY || "zkhKcHFg2AUGOr_u1V9eBxZu3qrZXP0nDisXFiRrZQU",
};

export function getActiveNetworkMode(): NetworkMode {
  if (typeof window === "undefined") return "TESTNET";
  const stored = localStorage.getItem("mesh_network_mode") || localStorage.getItem("mesh_ledger_protocol");
  if (stored && stored.toUpperCase().includes("MAINNET")) return "MAINNET";
  return "TESTNET";
}

export function getActivePublicKey(): string {
  const mode = getActiveNetworkMode();
  return MESH_NETWORK_KEYS[mode];
}

export function setNetworkMode(mode: NetworkMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("mesh_network_mode", mode);
  window.dispatchEvent(new CustomEvent("mesh_network_change", { detail: { mode } }));
}