// Location: context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

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
    accessToken: null,
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

  // 🛡️ UNIFIED HYDRATION ENGINE
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const cachedUser = localStorage.getItem("pi_auth_user");
      const meshUid = localStorage.getItem("mesh_pioneer_uid") || localStorage.getItem("BZR_PIONEER_UID");
      const meshUser = localStorage.getItem("mesh_pioneer_id") || localStorage.getItem("BZR_PIONEER_USER");
      const sessionActive = localStorage.getItem("mesh_session_active") === "true";
      const genesisCleared = localStorage.getItem("mesh_genesis_cleared") === "true";
      const storedToken = localStorage.getItem("pi_access_token");

      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        setPioneer({
          username: parsed.username || meshUser || "PinoyQ8",
          uid: parsed.uid || meshUid || "5f747bc9-1302-4135-a40d-af7880174f16",
          publicKey: parsed.publicKey,
          tier: parsed.tier || "CITIZEN",
          status: parsed.status || "ACTIVE",
          role: parsed.role || "PIONEER",
          trustScore: parsed.trustScore ?? 100,
          isAuthenticated: true,
          isHydrated: true,
          accessToken: parsed.accessToken || storedToken || "CACHED_SESSION_TOKEN",
        });
      } else if (sessionActive || genesisCleared || meshUid) {
        // 🛡️ RECONSTRUCT FROM MESH GENESIS MATRIX
        const reconstructed: PioneerState = {
          username: meshUser || "PinoyQ8",
          uid: meshUid || "5f747bc9-1302-4135-a40d-af7880174f16",
          publicKey: undefined,
          tier: "CITIZEN",
          status: "ACTIVE",
          role: "PIONEER",
          trustScore: 100,
          isAuthenticated: true,
          isHydrated: true,
          accessToken: storedToken || "NEO_SYNC_TOKEN",
        };
        localStorage.setItem("pi_auth_user", JSON.stringify(reconstructed));
        setPioneer(reconstructed);
      } else {
        setPioneer((prev) => ({ ...prev, isHydrated: true }));
      }
    } catch (e) {
      console.error("[MESH-AUTH] Failed to hydrate pioneer session:", e);
      setPioneer((prev) => ({ ...prev, isHydrated: true }));
    }
  }, []);

  const login = (data: Partial<PioneerState>) => {
    setPioneer((prev) => {
      const newState: PioneerState = {
        ...prev,
        ...data,
        isAuthenticated: true,
        isHydrated: true,
        status: (data.status as NodeStatus) || prev.status || "ACTIVE",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("pi_auth_user", JSON.stringify(newState));
        localStorage.setItem("mesh_session_active", "true");
        if (data.uid) localStorage.setItem("mesh_pioneer_uid", data.uid);
        if (data.username) localStorage.setItem("mesh_pioneer_id", data.username);
        if (data.accessToken) localStorage.setItem("pi_access_token", data.accessToken);
      }
      return newState;
    });
  };

  const logout = (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pi_auth_user");
      localStorage.removeItem("mesh_session_active");
      localStorage.removeItem("mesh_genesis_cleared");
      localStorage.removeItem("mesh_passkey_id");
      localStorage.removeItem("mesh_master_ts");
      localStorage.removeItem("mesh_pioneer_uid");
      localStorage.removeItem("mesh_pioneer_id");
      localStorage.removeItem("pi_access_token");
      localStorage.removeItem("BZR_PIONEER_UID");
      localStorage.removeItem("BZR_PIONEER_USER");
    }
    setPioneer({ ...FALLBACK_AUTH.pioneer, isHydrated: true });
  };

  const executeStakePayment = async (amount: number): Promise<void> => {
    try {
      const contractId = process.env.NEXT_PUBLIC_MESH_CONTRACT_ID;
      const userPublicKey = pioneer?.publicKey || process.env.NEXT_PUBLIC_TESTNET_WALLET;

      if (!contractId) throw new Error("Missing MESH contract ID.");
      if (!userPublicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(userPublicKey)) {
        throw new Error("MESH-SCAN: Pioneer wallet key is missing or invalid.");
      }

      const rpcUrl = process.env.NEXT_PUBLIC_PI_RPC_URL || "https://rpc.testnet.minepi.com";
      const networkPassphrase = process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE || "Pi Testnet";
      const server = new StellarSdk.rpc.Server(rpcUrl);

      const account = await server.getAccount(userPublicKey);
      const contract = new StellarSdk.Contract(contractId);

      const invokeOperation = contract.call(
        "sync_node",
        StellarSdk.nativeToScVal(userPublicKey, { type: "string" }),
        StellarSdk.nativeToScVal(BigInt(Math.round(amount * 10_000_000)), { type: "i128" })
      );

      const tx = new StellarSdk.TransactionBuilder(account, { fee: "100000", networkPassphrase })
        .addOperation(invokeOperation)
        .setTimeout(30)
        .build();

      const simulatedTx = await server.simulateTransaction(tx);

      if ("error" in simulatedTx && simulatedTx.error) {
        throw new Error(`Simulation failed: ${simulatedTx.error}`);
      }

      setPioneer((prev) => {
        const newState: PioneerState = {
          ...prev,
          tier: "MESH_GUARDIAN",
          trustScore: Math.min((prev.trustScore || 50) + 10, 100),
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("pi_auth_user", JSON.stringify(newState));
        }
        return newState;
      });
    } catch (error) {
      console.error("[MESH-AUTH] executeStakePayment error:", error);
      throw error;
    }
  };

  const contextValue = useMemo(
    () => ({
      pioneer,
      setPioneer,
      login,
      logout,
      executeStakePayment,
      isHydrated: pioneer.isHydrated,
      accessToken: pioneer.accessToken,
    }),
    [pioneer]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => useContext(AuthContext) ?? FALLBACK_AUTH;
export default useAuth;