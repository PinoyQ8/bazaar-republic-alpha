"use client";

import { useState } from 'react';

interface Heir {
  label: string;
  address: string;
  percent: number;
}

export default function HeirRegistryConsole({ citizenUID, liveAccessToken }: { citizenUID: string, liveAccessToken: string }) {
  // 1. RAM ALLOCATION (All hooks strictly inside the component)
  const [heirs, setHeirs] = useState<Heir[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [percentInput, setPercentInput] = useState<number | ''>('');
  
  const [consoleLog, setConsoleLog] = useState("Awaiting Heir Inputs...");
  const [authLog, setAuthLog] = useState<string>(""); // Moved inside
  const [isProcessing, setIsProcessing] = useState(false);

  // MATHEMATICAL LOCK: Calculate current total allocation
  const totalAllocation = heirs.reduce((sum, heir) => sum + heir.percent, 0);

  const addHeir = () => {
    if (!labelInput || !addressInput || !percentInput) {
      setConsoleLog("FAULT: All fields required to register an heir.");
      return;
    }

    const percentNum = Number(percentInput);
    if (totalAllocation + percentNum > 100) {
      setConsoleLog(`FAULT: Allocation exceeds 100%. Current total: ${totalAllocation}%`);
      return;
    }

    setHeirs([...heirs, { label: labelInput, address: addressInput, percent: percentNum }]);
    setLabelInput('');
    setAddressInput('');
    setPercentInput('');
    setConsoleLog(`Heir [${labelInput}] temporarily stored in RAM.`);
  };

  const removeHeir = (index: number) => {
    const updatedHeirs = heirs.filter((_, i) => i !== index);
    setHeirs(updatedHeirs);
    setConsoleLog("Heir purged from RAM.");
  };

  // Example of the updated interface if you pass the token as a prop:
// export default function HeirRegistryConsole({ citizenUID, liveAccessToken }: { citizenUID: string, liveAccessToken: string }) {

  const executeRegistrySeal = async () => {
    setIsProcessing(true);
    setConsoleLog("Initiating Secure Handshake via Pi Network...");

    // 🛡️ LIVE MAINNET VARIABLE (Replacing the sandbox mock)
    // const userAccessToken = liveAccessToken; 

    try {
      const response = await fetch('/api/register-heir', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${liveAccessToken}` // The real cryptographic signature
        },
        body: JSON.stringify({ 
          citizen_uid: citizenUID, 
          heirs: heirs 
        }),
      });

      const result = await response.json();
      setConsoleLog(`>_ Status ${response.status}: ${result.message}`);
      setAuthLog(`>_ ${result.message}`);

    } catch (error) {
      setConsoleLog("NETWORK FAULT: Adjudicator unreachable.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full mt-8 border border-purple-900 bg-black p-6 rounded-lg shadow-[0_0_20px_rgba(88,28,135,0.2)] font-mono">
      <div className="flex items-center gap-2 mb-4 text-purple-500 border-b border-purple-900 pb-2">
        <span className="material-icons">account_tree</span>
        <h3 className="text-lg font-bold uppercase tracking-widest">Deadman Registry</h3>
      </div>

      <div className="mb-4 text-xs text-purple-400 bg-gray-900 p-2 rounded border border-gray-800">
        {">_"} {consoleLog}
      </div>

      {/* INPUT MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input 
          id="heir-label"
          name="heirLabel"
          type="text" placeholder="Label (e.g. Reserve 1)" 
          className="bg-gray-950 border border-gray-700 text-white p-2 rounded text-sm focus:border-purple-500 outline-none md:col-span-1"
          value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
        />
        <input 
          id="heir-address"
          name="heirAddress"
          type="text" placeholder="Pi Wallet Address" 
          autoComplete="off" 
          className="bg-gray-950 border border-gray-700 text-white p-2 rounded text-sm focus:border-purple-500 outline-none md:col-span-2"
          value={addressInput} onChange={(e) => setAddressInput(e.target.value)}
        />
        <div className="flex gap-2 md:col-span-1">
          <input 
            id="heir-percent"
            name="heirPercent"
            type="number" placeholder="%" max="100" min="1"
            className="w-16 bg-gray-950 border border-gray-700 text-white p-2 rounded text-sm focus:border-purple-500 outline-none"
            value={percentInput} onChange={(e) => setPercentInput(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <button onClick={addHeir} className="flex-1 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded text-sm">
            ADD
          </button>
        </div>
      </div>

      {/* HEIR LIST IN RAM */}
      <div className="mb-4 flex flex-col gap-2">
        {heirs.map((heir, index) => (
          <div key={index} className="flex justify-between items-center bg-gray-900 border border-purple-900/50 p-2 rounded text-sm text-gray-300">
            <div>
              <span className="text-purple-400 font-bold">[{heir.percent}%]</span> {heir.label} <br/>
              <span className="text-xs text-gray-500">{heir.address}</span>
            </div>
            <button onClick={() => removeHeir(index)} className="text-red-500 hover:text-red-400 font-bold px-2">
              X
            </button>
          </div>
        ))}
      </div>

      {/* ALLOCATION BAR & SEAL TRIGGER */}
      <div className="mt-6 border-t border-purple-900 pt-4 flex flex-col items-center">
        <div className="w-full flex justify-between text-xs mb-1 text-gray-400">
          <span>Allocation Status:</span>
          <span className={totalAllocation === 100 ? "text-green-500 font-bold" : "text-yellow-500"}>
            {totalAllocation}% / 100%
          </span>
        </div>
        
        <div className="w-full bg-gray-900 h-2 rounded mb-4 overflow-hidden flex">
          {heirs.map((heir, index) => (
            <div key={index} style={{ width: `${heir.percent}%` }} className="h-full bg-purple-600 border-r border-black" />
          ))}
        </div>

        <button 
          onClick={executeRegistrySeal}
          disabled={isProcessing || totalAllocation !== 100}
          className={`w-full py-3 font-black uppercase tracking-widest rounded transition-all ${
            totalAllocation === 100 
              ? 'bg-purple-700 hover:bg-purple-600 text-white border border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.4)]' 
              : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
          }`}
        >
          {isProcessing ? 'Forging Registry...' : 'Seal Heir Registry'}
        </button>
      </div>

    </div>
  );
}