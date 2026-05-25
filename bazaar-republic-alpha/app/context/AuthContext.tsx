"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 1. Context Interface
const AuthContext = createContext<any>(null);

// 2. Export the Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// 3. Export the Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pioneer, setPioneer] = useState({ isAuthenticated: false, username: "" });
  const [isHydrated, setIsHydrated] = useState(false);

  const initializeGlobalAuth = async () => {
    try {
      // 🛡️ Alpha-Track Simulator (Hard-coded inline)
      if (typeof window !== "undefined" && !(window as any).Pi) {
        console.warn("[MESH-SCAN] ⚠️ window.Pi missing. Activating Simulator.");
        (window as any).Pi = {
          // Mock Auth
          authenticate: () => Promise.resolve({
            user: { uid: "ALPHA-999-TEST", username: "PioneerTestNode" },
            accessToken: "MOCK_TOKEN_GENESIS"
          }),
          // 🛡️ MESH-INJECTION: Sector 1 Payment Simulator
          createPayment: (paymentData: any, callbacks: any) => {
            console.log("[MESH-SIMULATOR] Intercepted payment request:", paymentData);
            
            // Step 1: Simulate Pioneer clicking "Pay" on their wallet
            setTimeout(() => {
              console.log("[MESH-SIMULATOR] User approved. Triggering server approval...");
              callbacks.onReadyForServerApproval("mock_payment_id_123");
              
              // Step 2: Simulate Server completing the transaction 2s later
              setTimeout(() => {
                console.log("[MESH-SIMULATOR] Server completed. Triggering DB write...");
                callbacks.onReadyForServerCompletion("mock_payment_id_123", "mock_txid_456");
              }, 2000);
            }, 1000);
          }
        };
      }

      const pi = (window as any).Pi;
      const auth = await pi.authenticate();
      
      setPioneer({ 
        isAuthenticated: true, 
        username: auth.user.username 
      });
      setIsHydrated(true);

    } catch (error) {
      console.error("[MESH-BRIDGE] 🚨 Handshake fracture:", error);
      setIsHydrated(true); // Force hydration so UI renders
    }
  };

  useEffect(() => {
    initializeGlobalAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ pioneer, setPioneer, isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
};