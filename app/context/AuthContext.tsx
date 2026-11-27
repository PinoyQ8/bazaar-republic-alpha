// Location: context/AuthContext.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
} from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { isFounderSubject, normalizeTierLevel } from "@/app/lib/governance/tierRbac";

export type NodeTier =
  | "CITIZEN"
  | "NOVICE"
  | "ACADEMY_CORE"
  | "MESH_GUARDIAN"
  | "BAZAAR_FOUNDER";
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
  hasActiveRole: boolean;
  isFounder: boolean;
}

const FALLBACK_PIONEER: PioneerState = {
  username: undefined,
  uid: undefined,
  publicKey: undefined,
  tier: "CITIZEN",
  status: "SYNCING",
  role: "NONE",
  trustScore: 0,
  isAuthenticated: false,
  isHydrated: false,
  accessToken: null,
};

const FALLBACK_AUTH: AuthContextType = {
  pioneer: FALLBACK_PIONEER,
  setPioneer: () => {},
  login: () => {},
  logout: () => {},
  executeStakePayment: async () => {},
  isHydrated: false,
  accessToken: null,
  hasActiveRole: false,
  isFounder: false,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pioneer, setPioneer] = useState<PioneerState>(FALLBACK_PIONEER);

  // 🛡️ UNIFIED HYDRATION ENGINE (No synthetic tokens or unverified auto-auth)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const meshUid =
        localStorage.getItem("mesh_pioneer_uid") ||
        localStorage.getItem("BZR_PIONEER_UID") ||
        undefined;
      const meshUser =
        localStorage.getItem("mesh_pioneer_id") ||
        localStorage.getItem("BZR_PIONEER_USER") ||
        undefined;
      const storedToken = localStorage.getItem("pi_access_token") || null;

      setPioneer((prev) => ({
        ...prev,
        uid: prev.uid || meshUid,
        username: prev.username || meshUser,
        accessToken: prev.accessToken || storedToken,
        isAuthenticated: false,
        isHydrated: true,
      }));
    } catch (e) {
      console.error("[MESH-AUTH] Failed to hydrate pioneer session:", e);
      setPioneer((prev) => ({ ...prev, isHydrated: true }));
    }
  }, []);

  const login = useCallback((data: Partial<PioneerState>) => {
    setPioneer((prev) => {
      const nextAuthenticated =
        typeof data.isAuthenticated === "boolean" ? data.isAuthenticated : true;
      const newState: PioneerState = {
        ...prev,
        ...data,
        isAuthenticated: nextAuthenticated,
        isHydrated: true,
        status: (data.status as NodeStatus) || prev.status || "ACTIVE",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("pi_auth_user", JSON.stringify(newState));
        if (nextAuthenticated) {
          localStorage.setItem("mesh_session_active", "true");
        } else {
          localStorage.removeItem("mesh_session_active");
        }
        if (data.uid) localStorage.setItem("mesh_pioneer_uid", data.uid);
        if (data.username) localStorage.setItem("mesh_pioneer_id", data.username);
        if (data.accessToken) localStorage.setItem("pi_access_token", data.accessToken);
      }
      return newState;
    });
  }, []);

  const logout = useCallback((): void => {
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
    setPioneer({ ...FALLBACK_PIONEER, isHydrated: true });
  }, []);

  const executeStakePayment = useCallback(
    async (amount: number): Promise<void> => {
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

        const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulatedTx).build();

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

        const sendRes = await server.sendTransaction(signedTx);
        if (sendRes.status === "ERROR") {
          throw new Error(
            `Transaction submission rejected: ${JSON.stringify(sendRes.errorResult)}`
          );
        }

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
          throw new Error(
            `Transaction ${sendRes.hash} did not succeed (status: ${txStatus.status}).`
          );
        }

        setPioneer((prev) => {
          const newState: PioneerState = {
            ...prev,
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
    },
    [pioneer?.publicKey]
  );

  const contextValue = useMemo(() => {
    const normalizedRole = (pioneer.role || "").trim().toUpperCase();
    const hasActiveRole = Boolean(
      pioneer.isAuthenticated &&
        normalizedRole &&
        normalizedRole !== "NONE" &&
        normalizedRole !== "GUEST"
    );
    const founder = isFounderSubject({
      role: pioneer.role || pioneer.tier,
    });
    void normalizeTierLevel(pioneer.tier);

    return {
      pioneer,
      setPioneer,
      login,
      logout,
      executeStakePayment,
      isHydrated: pioneer.isHydrated,
      accessToken: pioneer.accessToken,
      hasActiveRole,
      isFounder: founder,
    };
  }, [pioneer, setPioneer, login, logout, executeStakePayment]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => useContext(AuthContext) ?? FALLBACK_AUTH;
export default useAuth;