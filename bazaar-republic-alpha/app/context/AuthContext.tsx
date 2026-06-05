"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { signTransaction } from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

// 1. Interfaces
export interface PioneerState {
  username: string | undefined;
  uid: string | undefined;
  tier: string | undefined;
  role: string;
  trustScore: number;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

export interface AuthContextType {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: (data: PioneerState) => void;
  logout: () => void;
  executeStakePayment: (amount: number) => Promise<void>;
  isHydrated: boolean;
}

// 2. Context Initialization
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined,
    uid: undefined,
    tier: undefined,
    role: "CITIZEN",
    trustScore: 0,
    isAuthenticated: false,
    isHydrated: false,
  });

  const executeStakePayment = async (amount: number): Promise<void> => {
    try {
      const contractId = process.env.NEXT_PUBLIC_MESH_CONTRACT_ID;
      if (!contractId || !pioneer.uid) throw new Error("Missing requirements.");

      const server = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");
      const networkPassphrase = StellarSdk.Networks.TESTNET;
      const account = await server.getAccount(pioneer.uid);
      const contract = new StellarSdk.Contract(contractId);
      
      const invokeOperation = contract.call("stake", StellarSdk.nativeToScVal(pioneer.uid, { type: "address" }));
      const tx = new StellarSdk.TransactionBuilder(account, { fee: "20000000", networkPassphrase })
        .addOperation(invokeOperation)
        .setTimeout(30)
        .build();

      const simulatedTx = await server.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) throw new Error("Simulation failed.");

      const assembly = StellarSdk.rpc.assembleTransaction(tx, simulatedTx);
      const finalTx = assembly as unknown as StellarSdk.Transaction;

      const signResponse = await signTransaction(finalTx.toXDR(), { networkPassphrase });
      if (signResponse.error) throw new Error("Signature rejected.");

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signResponse.signedTxXdr, networkPassphrase);
      const response = await server.sendTransaction(signedTx);

      if ((response.status as string) === "SUCCESS") {
        setPioneer((prev) => ({ ...prev, tier: "TIER-5-ACTIVE", role: "PIONEER", trustScore: 100 }));
      } else {
        throw new Error("Transaction failed.");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const login = (data: PioneerState) => setPioneer(data);

  const logout = (): void => {
    setPioneer({
      username: undefined,
      uid: undefined,
      tier: undefined,
      role: "CITIZEN",
      trustScore: 0,
      isAuthenticated: false,
      isHydrated: true,
    });
  };

  const value: AuthContextType = {
    pioneer,
    setPioneer,
    login,
    logout,
    executeStakePayment,
    isHydrated: pioneer.isHydrated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Defensive Hook Execution
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      pioneer: { username: undefined, uid: undefined, tier: undefined, role: "CITIZEN", trustScore: 0, isAuthenticated: false, isHydrated: false },
      setPioneer: () => {},
      login: () => {},
      logout: () => {},
      executeStakePayment: async () => {},
      isHydrated: false,
    };
  }
  return context;
};