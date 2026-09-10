"use client";

/**
 * @file usePiLocalStorage.ts
 * @package Bazaar Republic Layer-2 DePIN Infrastructure
 * @version 1.0.0
 * @summary Client-side React hook wrapper designed for Samsung S23 Ultra and X570 node operators.
 * Integrates Next.js SSR hydration-safety gates, offline telemetry buffering, and persistent key-value 
 * caching. Reduces remote MongoDB Atlas read/write loads by utilizing the sandboxed local storage bridge.
 */

import { useState, useEffect, useCallback } from "react";

// Offline transaction envelope matching L2 schema constraints
export interface OfflineTx {
  txId: string;
  type: "ESCROW_LOCK" | "MEMBER_VOTE" | "TELEMETRY_PING";
  payload: any;
  timestamp: number;
}

export interface StorageOptions<T> {
  defaultValue: T;
  syncOnNetworkRecover?: boolean;
  syncEndpoint?: string;
  onSyncSuccess?: (data: T) => void;
}

export function usePiLocalStorage<T>(
  key: string,
  options: StorageOptions<T>
) {
  const [storedValue, setStoredValue] = useState<T>(options.defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Hydration Safe Init: Bypasses SSR mismatch issues by running strictly client-side on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // 1. Check network connectivity status
      setIsOnline(window.navigator.onLine);

      // 2. Retrieve existing item from sandboxed local storage
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        // Seed default if empty
        window.localStorage.setItem(key, JSON.stringify(options.defaultValue));
      }
    } catch (error) {
      console.warn(`[usePiLocalStorage] Error reading key "${key}":`, error);
    } finally {
      setIsHydrated(true);
    }
  }, [key, options.defaultValue]);

  // Network Status Listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update value state and write changes directly to persistent storage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        if (typeof window === "undefined") return;

        // Support functional state updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Update local React state first
        setStoredValue(valueToStore);
        
        // Persist to sandboxed device storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`[usePiLocalStorage] Error writing key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Background queue synchronization dispatcher
  const dispatchSync = useCallback(async () => {
    if (!options.syncOnNetworkRecover || !options.syncEndpoint || !isOnline || !isHydrated) return;

    try {
      console.log(`[usePiLocalStorage] Dispatching offline buffer sync for "${key}" to: ${options.syncEndpoint}`);
      
      const response = await fetch(options.syncEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": `sync_${key}_${Date.now()}`
        },
        body: JSON.stringify({ data: storedValue })
      });

      if (response.ok) {
        console.log(`[usePiLocalStorage] "${key}" successfully synchronized with bzr-db.`);
        if (options.onSyncSuccess) {
          options.onSyncSuccess(storedValue);
        }
      } else {
        throw new Error(`Sync rejected with status: ${response.status}`);
      }
    } catch (err) {
      console.warn(`[usePiLocalStorage] Offline sync fallback active for key "${key}":`, err);
    }
  }, [key, storedValue, options.syncOnNetworkRecover, options.syncEndpoint, isOnline, isHydrated, options.onSyncSuccess]);

  // Synchronize automatically when network recovers
  useEffect(() => {
    if (isOnline && isHydrated) {
      dispatchSync();
    }
  }, [isOnline, isHydrated, dispatchSync]);

  return [storedValue, setValue, { isHydrated, isOnline, triggerManualSync: dispatchSync }] as const;
}
