"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from "react";
// 🛡️ CRITICAL IMPORTS FOR SECTOR 1 PRODUCTION ENGINE
import * as StellarSdk from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

// ----------------------------------------------------------------------
// 🛡️ SCHEMA v2.5: Type Alignment & Dev Bypass Ready
// ----------------------------------------------------------------------
export type NodeTier = "CITIZEN" | "NOVICE" | "ACADEMY_CORE" | "MESH_GUARDIAN" | "BAZAAR_FOUNDER";
export type NodeStatus = "SYNCING" | "ACTIVE" | "FROZEN" | "SUSPENDED";

export interface PioneerState {
  username: string | undefined;
  uid: string | undefined;
  publicKey?: string; 
  tier: NodeTier;
  status: NodeStatus;
  role: string;
  trustScore: number;
  isAuthenticated: boolean;
  isHydrated: boolean;
  accessToken: string | null;
}

export interface AuthContextType {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: (data: Partial<PioneerState>) => void;
  logout: () => void;
  executeStakePayment: (amount: number) => Promise<void>; 
  isHydrated: boolean;
  accessToken: string | null;
}

const FALLBACK_AUTH: AuthContextType = {
  pioneer: { 
    username: undefined, 
    uid: undefined, 
    publicKey: undefined, 
    tier: "CITIZEN", 
    status: "SYNCING", 
    role: "CITIZEN", 
    trustScore: 0, 
    isAuthenticated: false, 
    isHydrated: false, 
    accessToken: null 
  },
  setPioneer: () => {},
  login: () => {},
  logout: () => {},
  executeStakePayment: async () => {}, 
  isHydrated: false,
  accessToken: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pioneer, setPioneer] = useState<PioneerState>(FALLBACK_AUTH.pioneer);

  useEffect(() => {
  try {
    const cachedUser = localStorage.getItem("pi_auth_user");
    const neoActive = localStorage.getItem("mesh_pioneer_active");
    const neoId = localStorage.getItem("mesh_pioneer_id");

    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      setPioneer({
        username: parsed.username,
        uid: parsed.uid,
        publicKey: parsed.publicKey,
        tier: parsed.tier || "CITIZEN",
        status: parsed.status || "ACTIVE",
        role: "PIONEER",
        trustScore: parsed.trustScore || 100,
        isAuthenticated: true,
        isHydrated: true,
        accessToken: "CACHED_SESSION_TOKEN"
      });
    } else if (neoActive === "true" && neoId) {
      // 🛡️ MESH-BRIDGE OVERRIDE: Sync with Genesis Gate local RAM keys
      const reconstructedState: PioneerState = {
        username: neoId,
        uid: neoId,
        publicKey: undefined,
        tier: "MESH_GUARDIAN",
        status: "ACTIVE",
        role: "PIONEER",
        trustScore: 100,
        isAuthenticated: true,
        isHydrated: true,
        accessToken: "NEO_SYNC_TOKEN"
      };
      localStorage.setItem("pi_auth_user", JSON.stringify(reconstructedState));
      setPioneer(reconstructedState);
    } else {
      setPioneer(prev => ({ ...prev, isHydrated: true }));
    }
  } catch (e) {
    console.error("[MESH-AUTH] Failed to read cached pioneer session", e);
    setPioneer(prev => ({ ...prev, isHydrated: true }));
  }
}, []);

  const login = (data: Partial<PioneerState>) => {
    setPioneer((prev) => {
      const newState = { ...prev, ...data, isHydrated: true, isAuthenticated: true };
      localStorage.setItem("pi_auth_user", JSON.stringify(newState));
      return newState;
    });
  };

  const logout = (): void => {
  localStorage.removeItem("pi_auth_user");
  localStorage.removeItem("mesh_pioneer_active");
  localStorage.removeItem("mesh_pioneer_id");
  localStorage.removeItem("mesh_pioneer_ts");
  localStorage.removeItem("mesh_pioneer_uid");
  localStorage.removeItem("mesh_pioneer_status");
  localStorage.removeItem("mesh_pioneer_tier");
  setPioneer({ ...FALLBACK_AUTH.pioneer, isHydrated: true });
};

  // 🛡️ SECTOR 1 ENGINE: Neo-Sync Execution
  const executeStakePayment = async (amount: number): Promise<void> => {
    try {
      const contractId = process.env.NEXT_PUBLIC_MESH_CONTRACT_ID;
      const userPublicKey = pioneer?.publicKey || process.env.NEXT_PUBLIC_TESTNET_WALLET;

      if (!contractId) throw new Error("Missing MESH contract ID.");
      if (!userPublicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(userPublicKey)) {
        throw new Error("MESH-SCAN Panic: Pioneer wallet key is missing or invalid.");
      }

      const rpcUrl = process.env.NEXT_PUBLIC_PI_RPC_URL || "https://rpc.testnet.minepi.com";
      const networkPassphrase = process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE || "Pi Testnet";
      const server = new StellarSdk.rpc.Server(rpcUrl);
      
      console.log(`[MESH-BRIDGE] Fetching sequence for: ${userPublicKey}`);
      const account = await server.getAccount(userPublicKey);
      const contract = new StellarSdk.Contract(contractId);
                 
      // WASM ALIGNMENT: sync_node(node_id: String)
      const invokeOperation = contract.call(
        "sync_node", 
        StellarSdk.nativeToScVal(userPublicKey, { type: "string" })
      );

      const tx = new StellarSdk.TransactionBuilder(account, { fee: "100000", networkPassphrase })
        .addOperation(invokeOperation)
        .setTimeout(30)
        .build();

      const simulatedTx = await server.simulateTransaction(tx);
      
      if ("error" in simulatedTx && simulatedTx.error) {
        throw new Error(`Soroban Simulation failed: ${simulatedTx.error}`);
      }

      // ==========================================
      // 🛡️ DEV BYPASS: FREIGHTER WALLET MOCK
      // ==========================================
      const isDevMode = process.env.NODE_ENV === 'development';
      
      if (isDevMode) {
        console.warn("[MESH-BRIDGE] DEV MODE ACTIVE: Bypassing Freighter Signature.");
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency
        
        setPioneer((prev) => {
          const newState = { 
            ...prev, 
            tier: "MESH_GUARDIAN" as NodeTier, 
            trustScore: Math.min((prev.trustScore || 50) + 10, 100) 
          };
          localStorage.setItem("pi_auth_user", JSON.stringify(newState));
          return newState;
        });
        
        console.log("[MESH-BRIDGE] Quantum tunnel secured. Neo-Sync node registered (MOCKED).");
        return; // Exit function successfully here
      }
      // ==========================================

      // The below will only run in Production where Freighter is expected
      const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulatedTx);
      const finalTx = assembledTx as unknown as StellarSdk.Transaction;

      const signResponse = await signTransaction(finalTx.toXDR(), { networkPassphrase });
      if (signResponse.error) throw new Error(`User rejected signature: ${signResponse.error}`);
      if (!signResponse.signedTxXdr) throw new Error("Signature failed: Empty payload.");

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signResponse.signedTxXdr, networkPassphrase);
      const response = await server.sendTransaction(signedTx);

      if ((response.status as string) === "SUCCESS" || response.status === "PENDING") {
        setPioneer((prev) => {
          const newState = { ...prev, tier: "MESH_GUARDIAN" as NodeTier, trustScore: Math.min((prev.trustScore || 50) + 10, 100) };
          localStorage.setItem("pi_auth_user", JSON.stringify(newState));
          return newState;
        });
        console.log("[MESH-BRIDGE] Quantum tunnel secured. Neo-Sync node registered on Testnet.");
      } else {
        throw new Error(`Broadcast failed: ${response.status}`);
      }
    } catch (error) {
      console.error("[MESH-SCAN] Execution Fracture in executeStakePayment:", error);
      throw error;
    }
  };

  const contextValue = useMemo(() => ({
    pioneer, setPioneer, login, logout, executeStakePayment, 
    isHydrated: pioneer.isHydrated, accessToken: pioneer.accessToken
  }), [pioneer]);

  if (!pioneer.isHydrated) return null; 

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => useContext(AuthContext) ?? FALLBACK_AUTH;
export default useAuth;