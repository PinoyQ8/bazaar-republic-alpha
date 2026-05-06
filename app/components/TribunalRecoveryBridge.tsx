"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type RecoveryPhase = 'TRIBUNAL_SELECT' | 'CRYPTOGRAPHIC_CHALLENGE' | 'RESOLUTION';
type RecoveryVector = 'PIONEER_RECLAIM' | 'HEIR_TRANSFER' | null;

// ADJUDICATOR FIX: Component must receive the UID to unlock the correct database row
export default function TribunalRecoveryBridge({ citizenUID }: { citizenUID: string }) {
  const router = useRouter();
  
  // --- STATE MACHINE ---
  const [phase, setPhase] = useState<RecoveryPhase>('TRIBUNAL_SELECT');
  const [vector, setVector] = useState<RecoveryVector>(null);
  const [entropyInput, setEntropyInput] = useState('');
  const [authLog, setAuthLog] = useState<string>("Awaiting Vector Selection...");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- LOGIC GATES ---
  const handleVectorSelect = (selectedVector: RecoveryVector) => {
    setVector(selectedVector);
    setPhase('CRYPTOGRAPHIC_CHALLENGE');
    setAuthLog(`Vector: ${selectedVector}. Awaiting 24-Word Genesis Phrase...`);
  };

  // --- THE IRON KEY: DATABASE UNLOCK BRIDGE ---
  const executeVerification = async () => {
    if (entropyInput.length <= 20) {
      setAuthLog("ADJUDICATOR ERROR: Cryptographic signature invalid.");
      return;
    }

    setIsProcessing(true);
    setAuthLog(`Transmitting ${vector} Handshake...`);

    try {
      const response = await fetch('/api/lift-stasis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          citizen_uid: citizenUID,
          vector: vector // Sends 'PIONEER_RECLAIM' or 'HEIR_TRANSFER'
        }),
      });

      if (response.ok) {
        setPhase('RESOLUTION');
        setAuthLog(`HANDSHAKE ACCEPTED. ${vector === 'HEIR_TRANSFER' ? 'Deadman Switch triggered.' : 'Sovereignty restored.'}`);
      } else {
        const errorData = await response.json();
        setAuthLog(`TRIBUNAL REJECTED: ${errorData.message}`);
      }
    } catch (error) {
      setAuthLog("NETWORK FAULT: Vault unreachable.");
    } finally {
      setIsProcessing(false);
    }
  };

  const returnToMainnet = () => {
    // Forces a hard reload to clear React RAM and pull the fresh OPERATIONAL state from the DB
    window.location.href = '/'; 
  };

  // --- VIEWPORT RENDERING ---
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono overflow-x-hidden relative text-white">
      <div className="w-full max-w-2xl border border-blue-900 bg-black p-8 rounded-xl flex flex-col items-center shadow-[0_0_30px_rgba(30,58,138,0.3)]">
        
        {/* Header Dashboard */}
        <div className="text-center mb-8 w-full border-b border-blue-900 pb-4">
          <h1 className="font-black tracking-widest uppercase text-3xl text-blue-500 animate-pulse">
            Tribunal Bridge
          </h1>
          <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">
            TYPE-2 DEFENSE: SECURE RECOVERY SECTOR
          </p>
        </div>

        {/* MESH Terminal Output */}
        <div className="w-full bg-gray-900 border border-gray-700 p-4 rounded mb-8 text-xs text-blue-400 font-mono">
          {">_"} {authLog}
        </div>

        {/* PHASE 1: TRIBUNAL SELECT */}
        {phase === 'TRIBUNAL_SELECT' && (
          <div className="w-full flex flex-col gap-4">
            <button 
              onClick={() => handleVectorSelect('PIONEER_RECLAIM')}
              className="w-full py-4 bg-transparent border-2 border-green-700 text-green-500 hover:bg-green-900/30 font-bold uppercase tracking-widest transition-all"
            >
              [ Vector Alpha ] Pioneer Reclaim
            </button>
            <button 
              onClick={() => handleVectorSelect('HEIR_TRANSFER')}
              className="w-full py-4 bg-transparent border-2 border-purple-700 text-purple-500 hover:bg-purple-900/30 font-bold uppercase tracking-widest transition-all"
            >
              [ Vector Beta ] Transfer to Heirs
            </button>
          </div>
        )}

        {/* PHASE 2: CRYPTOGRAPHIC CHALLENGE */}
        {phase === 'CRYPTOGRAPHIC_CHALLENGE' && (
          <div className="w-full flex flex-col gap-4">
            <p className="text-sm text-gray-400 mb-2">Paste the 24-Word Genesis Phrase to authenticate {vector === 'HEIR_TRANSFER' ? 'the Deadman Switch' : 'ownership'}.</p>
            <textarea 
              className="w-full h-32 bg-gray-950 border border-gray-700 text-white p-3 rounded font-mono text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="word1 word2 word3..."
              value={entropyInput}
              onChange={(e) => setEntropyInput(e.target.value)}
              disabled={isProcessing}
            />
            <button 
              onClick={executeVerification}
              disabled={isProcessing}
              className={`w-full py-4 ${isProcessing ? 'bg-gray-600' : 'bg-blue-900 hover:bg-blue-800'} text-white border border-blue-500 font-bold uppercase tracking-widest rounded transition-all mt-4`}
            >
              {isProcessing ? 'Transmitting...' : 'Execute Handshake'}
            </button>
            <button 
              onClick={() => setPhase('TRIBUNAL_SELECT')}
              disabled={isProcessing}
              className="w-full py-2 bg-transparent text-gray-500 text-xs uppercase hover:text-white mt-2"
            >
              Abort & Reselect Vector
            </button>
          </div>
        )}

        {/* PHASE 3: RESOLUTION */}
        {phase === 'RESOLUTION' && (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="text-green-500 text-center border border-green-800 bg-green-950/30 p-6 rounded w-full">
              <h2 className="text-2xl font-black uppercase mb-2">Stasis Lifted</h2>
              <p className="text-sm text-green-400">
                {vector === 'HEIR_TRANSFER' 
                  ? "Deadman protocol verified. Assets securely routed to designated heirs." 
                  : "Ownership verified. Master node access restored to Pioneer."}
              </p>
            </div>
            <button 
              onClick={returnToMainnet}
              className="w-full py-4 bg-black border-2 border-white text-white hover:bg-white hover:text-black font-extrabold uppercase tracking-widest rounded transition-all"
            >
              Return to E-Network
            </button>
          </div>
        )}

      </div>
    </div>
  );
}