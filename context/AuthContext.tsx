"use client"; // 🛡️ CRITICAL: Client-Side Boundary

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 🛡️ MESH TYPES: Strict Data Structuring
interface Pioneer {
  uid: string;
  username: string;
  tier?: string;
  isAuthenticated: boolean; // CRITICAL: Required for Hero Sector UI state
  // NOTE: accessToken is strictly forbidden from entering the UI state.
}

interface AuthContextType {
  pioneer: Pioneer | null;
  loading: boolean;
  login: (overrideUsername?: string, overrideTier?: string) => Promise<void>; // 🛡️ Dual-Protocol Support
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pioneer, setPioneer] = useState<Pioneer | null>(null);
  const [loading, setLoading] = useState(true);

  // 🛡️ PROTOCOL LAYER 1: RAM Hydration (Soft UI Sync)
  useEffect(() => {
    // We only store non-sensitive display data in local RAM
    const savedUsername = localStorage.getItem('Bazaar_Master_TS');
    const savedTier = localStorage.getItem('MESH_TIER');
    
    if (savedUsername) {
      setPioneer({
        uid: "CACHED-NODE",
        username: savedUsername,
        tier: savedTier || "STANDARD",
        isAuthenticated: true // Next.js Middleware acts as the absolute physical enforcer.
      });
    }
    setLoading(false);
  }, []);

  // 🛡️ PROTOCOL LAYER 2: Automated Self-Healing Sentinel (Stacked Transaction Clearer)
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      console.log("[MESH] Syncing global payment monitoring listener array...");
      
      // 🔒 TYPE ASSERTION BYPASS: Clears TS 2339 by casting the runtime object to any
      (window.Pi as any).registerOnIncompletePaymentFound(async (payment: any) => {
        console.warn(`[MESH-SCAN] Stacked transaction intercepted in network buffer: ${payment.paymentId}`);
        
        try {
          // Force-transmit the stuck ledger token straight to the Adjudicator completion gate
          const response = await fetch('/api/payments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              paymentId: payment.paymentId, 
              username: localStorage.getItem('Bazaar_Master_TS') || "UNKNOWN_NODE" 
            })
          });

          if (response.ok) {
            console.log("[SUCCESS] Stacked ledger state cleared dynamically. Buffer synchronized.");
          }
        } catch (error) {
          console.error("[FATAL] Self-healing automation layer fractured:", error);
        }
      });
    }
  }, [pioneer]);

  // 🛡️ PROTOCOL LAYER 3: The Dual-Protocol Handshake
  const login = async (overrideUsername?: string, overrideTier?: string) => {
    try {
      // PROTOCOL A: MANUAL GENESIS OVERRIDE (From RepublicHeroSector)
      if (overrideUsername) {
        console.log(`[MESH-SCAN] Genesis Node override acknowledged for: ${overrideUsername}`);
        setPioneer({
          uid: "GENESIS-ANCHOR",
          username: overrideUsername,
          tier: overrideTier || "GENESIS",
          isAuthenticated: true
        });
        localStorage.setItem('Bazaar_Master_TS', overrideUsername);
        if (overrideTier) localStorage.setItem('MESH_TIER', overrideTier);
        return; // Halt execution before hitting Pi SDK
      }

      // PROTOCOL B: THE TRUE SDK HANDSHAKE (Standard E-Network)
      if (!window.Pi) {
        throw new Error("[MESH-SCAN] Pi SDK not detected in the environment.");
      }

      console.log("[MESH-SCAN] Requesting Pi Network Sandbox Auth...");
      const auth = await window.Pi.authenticate(['payments', 'username'], (incomplete: any) => {
        console.warn("[MESH-SCAN] Incomplete payment found inside callback:", incomplete);
      });

      // THE HANDOFF: Send intercepted token to the server-side Adjudicator
      console.log("[MESH-SCAN] Token intercepted. Transmitting to Backend Vault...");
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        const verifiedPioneer = {
          uid: data.user.uid,
          username: data.user.username,
          tier: "STANDARD",
          isAuthenticated: true
        };

        // Update active context memory
        setPioneer(verifiedPioneer);
        localStorage.setItem('Bazaar_Master_TS', verifiedPioneer.username);
        
        console.log(`[MESH-SCAN] Handshake Confirmed. Welcome, ${verifiedPioneer.username}`);
      } else {
        throw new Error("Adjudicator Rejected the Token.");
      }
    } catch (error) {
      console.error("[MESH-SCAN] Auth Sector Fracture:", error);
    }
  };

  // 🛡️ PROTOCOL LAYER 4: The Purge Protocol
  const logout = async () => {
    try {
      setLoading(true);
      // Kill the HttpOnly Server Cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Obliterate Local RAM
      localStorage.removeItem('Bazaar_Master_TS');
      localStorage.removeItem('MESH_TIER');
      localStorage.removeItem('MESH_GENESIS_USER');
      localStorage.removeItem('MESH_ANCHOR');
      setPioneer(null);
      
      // Force Node Refresh
      window.location.reload();
    } catch (error) {
      console.error("[MESH-SCAN] Vault Purge Failure:", error);
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ pioneer, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🛡️ PROTOCOL LAYER 5: SECURED ADJUDICATOR HOOK (Upgraded Type Verification)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("[MESH-SCAN] Fatal Hook Invocation: useAuth must be wrapped inside an AuthProvider boundary.");
  }
  return context;
};