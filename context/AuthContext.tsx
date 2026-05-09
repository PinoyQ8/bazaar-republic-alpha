"use client"; // 🛡️ CRITICAL: This is a Client Component

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Pioneer {
  uid: string;
  username: string;
  accessToken: string;
}

const AuthContext = createContext<{
  pioneer: Pioneer | null;
  loading: boolean;
  login: () => Promise<void>;
}>({ pioneer: null, loading: true, login: async () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [pioneer, setPioneer] = useState<Pioneer | null>(null);
  const [loading, setLoading] = useState(true);

  // 🛡️ Logic to keep the session alive on refresh
  useEffect(() => {
    const saved = localStorage.getItem('Bazaar_Master_TS');
    if (saved) {
      setPioneer(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = async () => {
    try {
      if (!window.Pi) {
        throw new Error("Pi SDK not detected in the MESH.");
      }

      const auth = await window.Pi.authenticate(['payments', 'username'], (incomplete) => {
        console.log("Incomplete payment found:", incomplete);
      });

      const pioneerData = {
        uid: auth.user.uid,
        username: auth.user.username,
        accessToken: auth.accessToken
      };

      setPioneer(pioneerData);
      localStorage.setItem('Bazaar_Master_TS', JSON.stringify(pioneerData));
    } catch (error) {
      console.error("Auth Sector Fracture:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ pioneer, loading, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);