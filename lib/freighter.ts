import { isConnected, requestAccess, getNetwork, getAddress } from "@stellar/freighter-api";

export async function connectFreighter(): Promise<string> {
  // 1. Verify the Freighter extension is active on the node
  if (!(await isConnected())) {
    throw new Error("ERR_FREIGHTER_NOT_INSTALLED");
  }

  // 2. Request authorization from the user's wallet
  const access = await requestAccess();
  if (typeof access === 'object' && access !== null && 'error' in access) {
    throw new Error((access as any).error);
  }

  // 3. Enforce the Testnet boundary using your MESH config
  const networkData = await getNetwork();
  if (typeof networkData === 'object' && networkData !== null && 'error' in networkData) {
    throw new Error((networkData as any).error);
  }

  const currentNetwork = (networkData as any).network?.toUpperCase();
  const targetNetwork = process.env.NEXT_PUBLIC_SOROBAN_NETWORK?.toUpperCase() || "TESTNET";
  
  if (currentNetwork !== targetNetwork) {
    throw new Error(`ERR_WRONG_NETWORK: Please switch Freighter to ${targetNetwork}`);
  }

  // 4. Extract and return the public key for the session
  const addressData = await getAddress();
  if (typeof addressData === 'object' && addressData !== null && 'error' in addressData) {
    throw new Error((addressData as any).error);
  }

  // Handle version differences (string vs object return)
  const pubKey = typeof addressData === 'string' ? addressData : (addressData as any).address;
  
  if (!pubKey) {
    throw new Error("ERR_NO_ADDRESS_FOUND");
  }

  return pubKey;
}