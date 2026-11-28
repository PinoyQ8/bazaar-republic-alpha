// Location: app/context/AuthContext.tsx
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

export interface RoleSwitchParams {
  targetTier: NodeTier;
  requestedRole: string;
  allowDevOverride?: boolean;
}

export interface AuthContextType {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: (data: Partial<PioneerState>) => void;
  logout: () => void;
  syncSessionFromServer: (overrideUid?: string) => Promise<PioneerState | null>;
  switchFounderRole: (params: RoleSwitchParams) => Promise<PioneerState>;
  executeStakePayment: (amount: number) => Promise<void>;
  isHydrated: boolean;
  accessToken: string | null;
  hasActiveRole: boolean;
  isFounder: boolean;
}

const PLACEHOLDER_TOKENS = new Set([
  "",
  "CACHED_SESSION_TOKEN",
  "NEO_SYNC_TOKEN",
  "LOCAL_DEV_TOKEN",
]);

function sanitizeToken(raw?: string | null): string | null {
  const cleaned = typeof raw === "string" ? raw.trim() : "";
  if (!cleaned || PLACEHOLDER_TOKENS.has(cleaned)) return null;
  return cleaned;
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
  syncSessionFromServer: async () => null,
  switchFounderRole: async () => FALLBACK_PIONEER,
  executeStakePayment: async () => {},
  isHydrated: false,
  accessToken: null,
  hasActiveRole: false,
  isFounder: false,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function assertSignedTxMatchesPrepared(
  preparedTx: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction,
  signedTx: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction
): void {
  const preparedInner =
    preparedTx instanceof StellarSdk.FeeBumpTransaction
      ? preparedTx.innerTransaction
      : preparedTx;
  const signedInner =
    signedTx instanceof StellarSdk.FeeBumpTransaction
      ? signedTx.innerTransaction
      : signedTx;

  if (signedInner.source !== preparedInner.source) {
    throw new Error("[MESH-AUTH] Signed transaction source does not match prepared source.");
  }
  if (signedInner.sequence !== preparedInner.sequence) {
    throw new Error("[MESH-AUTH] Signed transaction sequence does not match prepared sequence.");
  }
  if (signedInner.operations.length !== preparedInner.operations.length) {
    throw new Error("[MESH-AUTH] Signed transaction operation count mismatch.");
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pioneer, setPioneer] = useState<PioneerState>(FALLBACK_PIONEER);

  const login = useCallback((data: Partial<PioneerState>) => {
    setPioneer((prev) => {
      const nextAuthenticated =
        typeof data.isAuthenticated === "boolean" ? data.isAuthenticated : true;
      const nextToken =
        data.accessToken !== undefined
          ? sanitizeToken(data.accessToken)
          : sanitizeToken(prev.accessToken);

      const newState: PioneerState = {
        ...prev,
        ...data,
        tier: (data.tier as NodeTier) || prev.tier || "CITIZEN",
        role: data.role || prev.role || "NONE",
        status: (data.status as NodeStatus) || prev.status || "ACTIVE",
        accessToken: nextToken,
        isAuthenticated: nextAuthenticated,
        isHydrated: true,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("pi_auth_user", JSON.stringify(newState));
        if (nextAuthenticated) {
          localStorage.setItem("mesh_session_active", "true");
        } else {
          localStorage.removeItem("mesh_session_active");
        }
        if (newState.uid) localStorage.setItem("mesh_pioneer_uid", newState.uid);
        if (newState.username) localStorage.setItem("mesh_pioneer_id", newState.username);
        if (nextToken) {
          localStorage.setItem("pi_access_token", nextToken);
        } else {
          localStorage.removeItem("pi_access_token");
        }
      }
      return newState;
    });
  }, []);

  // 🛡️ UNIFIED HYDRATION ENGINE (Preserves valid cached tier/role without synthetic tokens)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const cachedRaw = localStorage.getItem("pi_auth_user");
      const cachedUser = cachedRaw ? JSON.parse(cachedRaw) : null;
      const meshUid =
        cachedUser?.uid ||
        localStorage.getItem("mesh_pioneer_uid") ||
        localStorage.getItem("BZR_PIONEER_UID") ||
        undefined;
      const meshUser =
        cachedUser?.username ||
        localStorage.getItem("mesh_pioneer_id") ||
        localStorage.getItem("BZR_PIONEER_USER") ||
        undefined;
      const sessionActive = localStorage.getItem("mesh_session_active") === "true";
      const storedToken = sanitizeToken(
        cachedUser?.accessToken || localStorage.getItem("pi_access_token")
      );

      setPioneer((prev) => ({
        ...prev,
        uid: meshUid || prev.uid,
        username: meshUser || prev.username,
        publicKey: cachedUser?.publicKey || prev.publicKey,
        tier: (cachedUser?.tier as NodeTier) || prev.tier || "CITIZEN",
        role: cachedUser?.role || prev.role || "NONE",
        status: (cachedUser?.status as NodeStatus) || prev.status || "ACTIVE",
        trustScore: cachedUser?.trustScore ?? prev.trustScore ?? 100,
        accessToken: storedToken,
        isAuthenticated: Boolean(meshUid && (sessionActive || storedToken)),
        isHydrated: true,
      }));
    } catch (e) {
      console.error("[MESH-AUTH] Failed to hydrate pioneer session:", e);
      setPioneer((prev) => ({ ...prev, isHydrated: true }));
    }
  }, []);

  const syncSessionFromServer = useCallback(
    async (overrideUid?: string): Promise<PioneerState | null> => {
      const targetUid = (overrideUid || pioneer.uid || "").trim();
      if (!targetUid) return null;

      try {
        const res = await fetch(
          `/api/passport?uid=${encodeURIComponent(targetUid)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return null;

        const data = await res.json().catch(() => null);
        const node = data?.pioneer;
        if (!node?.uid) return null;

        let syncedState: PioneerState | null = null;
        setPioneer((prev) => {
          syncedState = {
            ...prev,
            uid: node.uid,
            username: node.username || prev.username,
            publicKey: node.walletAddress ?? prev.publicKey,
            tier: (node.tier as NodeTier) || prev.tier,
            role: node.assignedChamber || prev.role,
            status: (node.status as NodeStatus) || prev.status || "ACTIVE",
            trustScore: node.trustScore ?? prev.trustScore ?? 100,
            isAuthenticated: true,
            isHydrated: true,
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("pi_auth_user", JSON.stringify(syncedState));
            localStorage.setItem("mesh_session_active", "true");
            localStorage.setItem("mesh_pioneer_uid", node.uid);
            if (node.username) localStorage.setItem("mesh_pioneer_id", node.username);
          }
          return syncedState;
        });

        return syncedState;
      } catch (err) {
        console.error("[MESH-AUTH] Server passport sync failed:", err);
        return null;
      }
    },
    [pioneer.uid]
  );

  const switchFounderRole = useCallback(
    async (params: RoleSwitchParams): Promise<PioneerState> => {
      const targetUid = (pioneer.uid || "").trim();
      if (!targetUid) {
        throw new Error("MISSING_TARGET_UID: Authenticate a Pioneer session first.");
      }

      const realToken =
        sanitizeToken(pioneer.accessToken) ||
        (typeof window !== "undefined"
          ? sanitizeToken(window.localStorage.getItem("pi_access_token"))
          : null);

      const useDevOverride =
        !realToken &&
        process.env.NODE_ENV !== "production" &&
        (params.allowDevOverride ?? true);

      if (!realToken && !useDevOverride) {
        throw new Error(
          "MISSING_PI_ACCESS_TOKEN: Sign in via Pi Browser or enable local dev override."
        );
      }

      const res = await fetch("/api/founder/account-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(realToken ? { Authorization: `Bearer ${realToken}` } : {}),
        },
        body: JSON.stringify({
          targetUid,
          username: pioneer.username,
          targetTier: params.targetTier,
          requestedRole: params.requestedRole,
          ...(realToken ? { accessToken: realToken } : {}),
          ...(useDevOverride ? { devOverride: true } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.pioneer) {
        throw new Error(data?.error || `HTTP_${res.status}: Role update rejected.`);
      }

      const persisted = data.pioneer;
      const nextState: PioneerState = {
        ...pioneer,
        uid: persisted.uid,
        username: persisted.username,
        publicKey: persisted.walletAddress ?? pioneer.publicKey,
        tier: persisted.tier as NodeTier,
        role: persisted.assignedChamber ?? params.requestedRole,
        status: (persisted.status as NodeStatus) || "ACTIVE",
        trustScore: persisted.trustScore ?? pioneer.trustScore ?? 100,
        accessToken: realToken,
        isAuthenticated: true,
        isHydrated: true,
      };

      login(nextState);
      return nextState;
    },
    [pioneer, login]
  );

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
        if (pioneer.status === "FROZEN" || pioneer.status === "SUSPENDED") {
          throw new Error(
            `MESH-SCAN: Pioneer account status is ${pioneer.status}. Staking is blocked.`
          );
        }

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

        const stroopsAmount = BigInt(Math.round(amount * 10_000_000));
        if (stroopsAmount <= 0n) {
          throw new Error(
            "MESH-SCAN: Stake amount is too small after stroop conversion (must be >= 0.0000001)."
          );
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
        assertSignedTxMatchesPrepared(assembledTx, signedTx);

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
    [pioneer?.publicKey, pioneer?.status]
  );

  const contextValue = useMemo(() => {
    const normalizedRole = (pioneer.role || "").trim().toUpperCase();
    const hasActiveRole = Boolean(
      pioneer.isAuthenticated &&
        normalizedRole &&
        normalizedRole !== "NONE" &&
        normalizedRole !== "GUEST"
    );
    const founder =
      isFounderSubject({ role: pioneer.role }) ||
      isFounderSubject({ role: pioneer.tier });
    void normalizeTierLevel(pioneer.tier);

    return {
      pioneer,
      setPioneer,
      login,
      logout,
      syncSessionFromServer,
      switchFounderRole,
      executeStakePayment,
      isHydrated: pioneer.isHydrated,
      accessToken: pioneer.accessToken,
      hasActiveRole,
      isFounder: founder,
    };
  }, [
    pioneer,
    login,
    logout,
    syncSessionFromServer,
    switchFounderRole,
    executeStakePayment,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => useContext(AuthContext) ?? FALLBACK_AUTH;
export default useAuth;