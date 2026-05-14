"use client"; // 🛡️ CRITICAL: Client-Side Boundary

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 🛡️ MESH TYPES: Strict Data Structuring
interface Pioneer {
  uid: string;
  username: string;
  // NOTE: accessToken is strictly forbidden from entering the UI state.
}

interface AuthContextType {
  pioneer: Pioneer | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>; // Added the Purge Protocol
}

const AuthContext = createContext<AuthContextType>({ 
  pioneer: null, 
  loading: true, 
  login: async () => {},
  logout: async () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pioneer, setPioneer] = useState<Pioneer | null>(null);
  const [loading, setLoading] = useState(true);

  // 🛡️ RAM HYDRATION: Soft UI Sync
  useEffect(() => {
    // We only store non-sensitive display data in local RAM
    const savedUsername = localStorage.getItem('Bazaar_Master_TS');
    if (savedUsername) {
      setPioneer({
        uid: "CACHED-NODE",
        username: savedUsername
      });
    }
    setLoading(false);
  }, []);

  // 🛡️ THE TRUE SDK HANDSHAKE
  const login = async () => {
    try {
      if (!window.Pi) {
        throw new Error("[MESH-SCAN] Pi SDK not detected in the environment.");
      }

      console.log("[MESH-SCAN] Requesting Pi Network Sandbox Auth...");
      const auth = await window.Pi.authenticate(['payments', 'username'], (incomplete: any) => {
        console.warn("[MESH-SCAN] Incomplete payment found:", incomplete);
      });

      // 🛡️ THE HANDOFF: Send the token to the X570 Adjudicator
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
        };

        // 1. Update React State
        setPioneer(verifiedPioneer);
        
        // 2. Lock non-sensitive display name into RAM for quick reloads
        localStorage.setItem('Bazaar_Master_TS', verifiedPioneer.username);
        
        console.log(`[MESH-SCAN] Handshake Confirmed. Welcome, ${verifiedPioneer.username}`);
      } else {
        throw new Error("Adjudicator Rejected the Token.");
      }
    } catch (error) {
      console.error("[MESH-SCAN] Auth Sector Fracture:", error);
      // Optional: Add a UI toast notification here later
    }
  };

  // 🛡️ THE PURGE PROTOCOL
  const logout = async () => {
    try {
      setLoading(true);
      // 1. Kill the HttpOnly Server Cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      // 2. Wipe Local RAM
      localStorage.removeItem('Bazaar_Master_TS');
      setPioneer(null);
      // 3. Force Node Refresh
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

export const useAuth = () => useContext(AuthContext);