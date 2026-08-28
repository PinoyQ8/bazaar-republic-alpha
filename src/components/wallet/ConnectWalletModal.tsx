'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { WalletDriverType } from '@/types/wallet';

interface DriverOption {
  id: WalletDriverType;
  label: string;
  badge: string;
}

const DRIVERS: DriverOption[] = [
  { id: 'local_dev', label: 'Local Dev Signer', badge: 'X570 Standalone' },
  { id: 'soroban_freighter', label: 'Freighter / Soroban', badge: 'Mainnet / Testnet' },
  { id: 'pi_network', label: 'Pi Browser Node', badge: 'Pi Bridge' },
];

export const ConnectWalletModal = ({ onClose }: { onClose: () => void }) => {
  const { connect, isConnecting, error } = useWallet();

  const handleSelect = async (id: WalletDriverType) => {
    await connect(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-zinc-100">Select Signer Protocol</h3>
        <p className="mt-1 text-xs text-zinc-400">Choose node or driver for transaction signing.</p>

        {error && (
          <div className="mt-3 rounded border border-red-900/50 bg-red-950/30 p-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {DRIVERS.map((driver) => (
            <button
              key={driver.id}
              disabled={isConnecting}
              onClick={() => handleSelect(driver.id)}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-800"
            >
              <div>
                <div className="text-sm font-medium text-zinc-200">{driver.label}</div>
                <div className="text-[10px] text-zinc-500">{driver.badge}</div>
              </div>
              <span className="text-xs text-zinc-400">→</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded border border-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
