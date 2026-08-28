'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletContextState, WalletAccount, WalletDriverType, ISignerDriver } from '@/types/wallet';
import { LocalDevDriver } from '@/lib/wallet/drivers/localDevDriver';
import { FreighterDriver } from '@/lib/wallet/drivers/freighterDriver';
import { PiNetworkDriver } from '@/lib/wallet/drivers/piNetworkDriver';

const WalletContext = createContext<WalletContextState | undefined>(undefined);

const drivers: Record<WalletDriverType, ISignerDriver | null> = {
  local_dev: new LocalDevDriver(),
  soroban_freighter: new FreighterDriver(),
  pi_network: new PiNetworkDriver(),
  none: null,
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [driverType, setDriverType] = useState<WalletDriverType>('none');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedDriver = localStorage.getItem('bazaar_wallet_driver') as WalletDriverType;
    if (savedDriver && drivers[savedDriver]) {
      connect(savedDriver).catch(() => localStorage.removeItem('bazaar_wallet_driver'));
    }
  }, []);

  const connect = async (driverKey: WalletDriverType) => {
    setIsConnecting(true);
    setError(null);
    try {
      const driver = drivers[driverKey];
      if (!driver) throw new Error(`Unsupported driver: ${driverKey}`);

      const available = await driver.isAvailable();
      if (!available) throw new Error(`${driver.name} is not available in this environment`);

      const acc = await driver.connect();
      setAccount(acc);
      setDriverType(driverKey);
      localStorage.setItem('bazaar_wallet_driver', driverKey);
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (driverType !== 'none' && drivers[driverType]) {
      await drivers[driverType]!.disconnect();
    }
    setAccount(null);
    setDriverType('none');
    localStorage.removeItem('bazaar_wallet_driver');
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    if (!account || driverType === 'none' || !drivers[driverType]) {
      throw new Error('Wallet not connected');
    }
    return drivers[driverType]!.signTransaction(xdr);
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        driverType,
        isConnected: !!account,
        isConnecting,
        error,
        connect,
        disconnect,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};