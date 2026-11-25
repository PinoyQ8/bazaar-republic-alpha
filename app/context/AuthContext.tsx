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

  // ðŸ›¡ï¸ UNIFIED HYDRATION ENGINE
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
        // ðŸ›¡ï¸ RECONSTRUCT FROM MESH GENESIS MATRIX
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
       const targetContractId = (
  process.env.NEXT_PUBLIC_STAKE_CONTRACT_ID ||
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  "CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV"
).trim();

      const targetMethod = (
        process.env.NEXT_PUBLIC_STAKE_METHOD || "lock_funds"
      ).trim();

      const tokenContractId = (
        process.env.NEXT_PUBLIC_PI_TOKEN_CONTRACT ||
        "CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ"
      ).trim();

      const userPublicKey = (
        pioneer?.publicKey ||
        process.env.NEXT_PUBLIC_TESTNET_WALLET ||
        process.env.NEXT_PUBLIC_PI_ADMIN_PUBLIC_KEY ||
        ""
      ).trim();

      const recipientPublicKey = (
        process.env.NEXT_PUBLIC_STAKE_RECIPIENT ||
        process.env.NEXT_PUBLIC_PI_ADMIN_PUBLIC_KEY ||
        userPublicKey
      ).trim();

      if (!targetContractId || !StellarSdk.StrKey.isValidContract(targetContractId)) {
        throw new Error("MESH-SCAN: Target stake contract ID is missing or invalid.");
      }
      if (!userPublicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(userPublicKey)) {
        throw new Error(
          "MESH-SCAN: Pioneer wallet key is missing or invalid. Set NEXT_PUBLIC_TESTNET_WALLET to a valid G... public key or bind one to your Pioneer profile."
        );
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("MESH-SCAN: Stake amount must be greater than zero.");
      }

      const rpcUrl = (
        process.env.NEXT_PUBLIC_PI_RPC_URL ||
        process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
        "https://rpc.testnet.minepi.com"
      ).trim();
      const networkPassphrase = (
        process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE ||
        process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
        "Pi Testnet"
      ).trim();

      const server = new StellarSdk.rpc.Server(rpcUrl, {
        allowHttp: rpcUrl.startsWith("http://"),
      });

      const account = await server.getAccount(userPublicKey);
      const contract = new StellarSdk.Contract(targetContractId);
      const stroopsAmount = BigInt(Math.round(amount * 10_000_000));

      let invokeOperation: StellarSdk.xdr.Operation;

      if (targetMethod === "transfer") {
        invokeOperation = contract.call(
          "transfer",
          StellarSdk.Address.fromString(userPublicKey).toScVal(),
          StellarSdk.Address.fromString(recipientPublicKey).toScVal(),
          StellarSdk.nativeToScVal(stroopsAmount, { type: "i128" })
        );
      } else {
        const escrowId = `STAKE_${Date.now().toString().slice(-8)}`;
        const durationSecs = BigInt(7 * 24 * 60 * 60);

        invokeOperation = contract.call(
          "lock_funds",
          StellarSdk.xdr.ScVal.scvSymbol(escrowId),
          StellarSdk.Address.fromString(tokenContractId).toScVal(),
          StellarSdk.Address.fromString(userPublicKey).toScVal(),
          StellarSdk.Address.fromString(recipientPublicKey).toScVal(),
          StellarSdk.nativeToScVal(stroopsAmount, { type: "i128" }),
          StellarSdk.nativeToScVal(durationSecs, { type: "u64" })
        );
      }

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase,
      })
        .addOperation(invokeOperation)
        .setTimeout(30)
        .build();

      const simulatedTx = await server.simulateTransaction(tx);

      if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) {
        throw new Error(`Simulation failed: ${simulatedTx.error}`);
      }

      // 1. Assemble simulated transaction (footprints & Soroban data)
      const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulatedTx).build();

      // 2. Resolve a browser wallet signer safely from window if present
      const walletProvider =
        typeof window !== "undefined"
          ? (window as any).freighterApi || (window as any).stellar || (window as any).piWallet
          : null;

      if (!walletProvider || typeof walletProvider.signTransaction !== "function") {
        throw new Error(
          "No browser wallet signTransaction adapter detected. Connect a compatible wallet or route signing through a relayer."
        );
      }

      const signResult = await walletProvider.signTransaction(assembledTx.toXDR(), {
        networkPassphrase,
      });

      if (signResult?.error) {
        throw new Error(`Signature rejected: ${signResult.error}`);
      }

      const signedXdr =
        typeof signResult === "string"
          ? signResult
          : signResult?.signedTxXdr || signResult?.xdr || signResult?.txXdr;

      if (!signedXdr || typeof signedXdr !== "string") {
        throw new Error("Signed transaction XDR missing.");
      }

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

      // 3. Submit transaction to Pi Testnet RPC
      const sendRes = await server.sendTransaction(signedTx);
      if (sendRes.status === "ERROR") {
        throw new Error(`Transaction submission rejected: ${JSON.stringify(sendRes.errorResult)}`);
      }

      // 4. Poll getTransaction until confirmed on-chain
      let txStatus = await server.getTransaction(sendRes.hash);
      let attempts = 0;
      const maxAttempts = 20;

      while (
        txStatus.status === StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND &&
        attempts < maxAttempts
      ) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        txStatus = await server.getTransaction(sendRes.hash);
      }

      if (txStatus.status !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
        throw new Error(`Transaction ${sendRes.hash} did not succeed (status: ${txStatus.status}).`);
      }

      // 5. Commit confirmed tier & trustScore only after on-chain success
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
    [pioneer, setPioneer, login, logout, executeStakePayment]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => useContext(AuthContext) ?? FALLBACK_AUTH;
export default useAuth;
