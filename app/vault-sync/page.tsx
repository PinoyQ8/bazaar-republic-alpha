"use client";

import React, { useState } from 'react';
// NECO-SYNC Imports
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Str from "@ledgerhq/hw-app-str";
import { StrKey } from "stellar-base"; 

export default function VaultSync() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connectVault = async () => {
    setLoading(true);
    try {
      // 1. Establish HID Bridge (Resilient on X570)
      const transport = await TransportWebHID.create();
      const str = new Str(transport);
      
      // 2. The Path
      const path = "44'/148'/0'"; 
      
      console.log("MESH: HID Bridge Established. Confirm on Ledger...");
      
      // 3. Extract Raw Bytes from the Secure Element
      const result = await str.getPublicKey(path, true);
      
      // 4. Encode to Pi Network G-Address Format
      const gAddress = StrKey.encodeEd25519PublicKey(result.rawPublicKey);
      
      setAddress(gAddress);
      
      // BAZAAR TECH: Ready for Test-Pi Faucet Drop
      console.log("Vault Extraction Successful:", gAddress);
      console.log("Targeting: Pi Testnet Horizon");
      
      // 5. Clean up port
      await transport.close();
      
    } catch (error: any) {
      console.error("MESH Bridge Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 min-h-screen bg-gray-900 text-white font-sans">
      <div className="max-w-2xl mx-auto border border-green-500/30 p-8 rounded-lg bg-black/50">
        <h1 className="text-2xl font-bold text-green-500 mb-2">NEO-SYNC: VAULT BRIDGE</h1>
        <p className="text-gray-400 mb-8 text-sm uppercase tracking-tighter">Domain: Project Bazaar / Test-Pi Sector</p>
        
        <button 
          onClick={connectVault}
          disabled={loading}
          className={`w-full py-4 font-bold rounded transition-all border-b-4 ${
            loading 
              ? 'bg-yellow-600 border-yellow-800 animate-pulse cursor-wait' 
              : 'bg-green-600 border-green-800 hover:bg-green-500 hover:scale-[1.01]'
          }`}
        >
          {loading ? "COMMUNICATING WITH LEDGER..." : "CONNECT HARDWARE VAULT"}
        </button>

        {address && (
          <div className="mt-8 p-6 bg-green-950/20 border border-green-500/50 rounded shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <h2 className="text-xs text-green-400 uppercase font-black mb-3">Verified G-Address (Testnet Ready)</h2>
            <p className="font-mono text-green-400 break-all select-all text-lg bg-black/40 p-3 rounded">
              {address}
            </p>
            <div className="mt-4 flex gap-2">
                <span className="text-[10px] bg-green-900/50 text-green-300 px-2 py-1 rounded">X570_ACTIVE</span>
                <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-1 rounded">WEB_HID_BRIDGE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}