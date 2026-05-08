"use client";

import TribunalRecoveryBridge from './components/TribunalRecoveryBridge';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import HeirRegistryConsole from './components/HeirRegistryConsole';
import TreasuryDashboard from './components/TreasuryDashboard';

// 🛡️ TYPE DECLARATION: Silence the TS Adjudicator for the Pi Object
declare global {
  interface Window {
    Pi: any;
  }
}

// 🛡️ ADDED: 'SCREENING' Phase
type MeshPhase = 'GENESIS' | 'SCREENING' | 'OPERATIONAL' | 'INTERCEPT' | 'STASIS';

// =========================================================================
// 1. THE EMBEDDED SHIELD (Fused locally to prevent import crashes)
// =========================================================================
interface GracePeriodProps {
  onAuthorize: () => void;
  onStasis: () => void;
}

function GracePeriodBuffer({ onAuthorize, onStasis }: GracePeriodProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onAuthorize();
      return;
    }
    const timerInterval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerInterval);
  }, [timeLeft, onAuthorize]);

  return (
    <div className="w-full flex flex-col items-center border border-yellow-500/50 bg-black p-6 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.2)]">
      <div className="flex items-center justify-center gap-3 mb-4 text-yellow-500">
        <h2 className="text-xl font-bold uppercase tracking-widest text-center">Interception Shield Active</h2>
      </div>
      <p className="text-gray-400 text-sm text-center mb-6">
        Transaction pending. You have 60 seconds to review the destination address. 
        If you suspect a breach, engage STASIS immediately.
      </p>
      <div className="text-6xl font-black text-yellow-500 mb-8 font-mono tracking-widest">
        00:{timeLeft.toString().padStart(2, '0')}
      </div>
      <div className="w-full grid grid-cols-1 gap-4">
        <button onClick={onAuthorize} className="w-full py-4 bg-green-900 text-green-400 font-bold uppercase rounded border border-green-500">
          Authorize Now
        </button>
        <button onClick={onStasis} className="w-full py-4 bg-red-900 text-white font-black uppercase rounded border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          Engage Stasis
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// 2. THE MASTER NODE LOGIC
// =========================================================================
export default function RepublicMasterNode() {
  // 🛡️ BAZAAR AUTH RAM (Master Node State)
  const [tokenFromPi, setTokenFromPi] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<MeshPhase>('GENESIS');
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [citizenUID, setCitizenUID] = useState<string | null>(null);
  const sdkInitialized = useRef(false);

  // 🛡️ NEW RAM: Screening Protocol
  const [screeningAnswer, setScreeningAnswer] = useState<string>("");
  const [screeningError, setScreeningError] = useState<string>("");
  const screeningQuestion = "What is the ultimate goal of the E-Network ecosystem? (Hint: Think decentralization)";
  const acceptableKeywords = ["decentralization", "web3", "pioneer", "security", "dao", "freedom", "ecosystem"];

  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  // --- THE IRON SHIELD: DATABASE LOCK BRIDGE ---
  const executeDatabaseLock = async () => {
    if (!citizenUID) {
      addLog("FAULT: No Citizen UID found in RAM.");
      return;
    }

    try {
      addLog("Transmitting STASIS protocol to Vercel Vault...");
      const response = await fetch('/api/engage-stasis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_uid: citizenUID }),
      });

      if (response.ok) {
        addLog("VAULT CONFIRMED: Database Record Sealed.");
        setCurrentPhase('STASIS'); 
      } else {
        const errorData = await response.json();
        addLog(`LOCK FAILED: ${errorData.message}`);
      }
    } catch (error) {
      addLog("NETWORK FAULT: Could not reach Vault.");
    }
  };

  // --- THE IGNITION AND GATEKEEPER ---
  const executePiHandshake = async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      addLog("FOUNDER OVERRIDE: Desktop Diagnostic Mode.");
      setCitizenUID("SYS_ADMIN_X570");
      setTokenFromPi("DESKTOP_MOCK_TOKEN");
      setCurrentPhase('OPERATIONAL'); // Bypasses screening for local X570 testing
      return;
    }

    try {
      if (!sdkInitialized.current) {
        window.Pi.init({ version: "2.0", sandbox: true });
        sdkInitialized.current = true;
        addLog("Pi SDK Handshake: INITIALIZED.");
      }

      addLog("Initiating Pi Core Authentication...");
      const scopes = ['username', 'payments']; 
      
      const auth = await window.Pi.authenticate(scopes, (incompletePayment: any) => {
        addLog(`Incomplete payment: ${incompletePayment.identifier}`);
      });

      if (auth && auth.user) {
        const liveUID = auth.user.uid;
        setCitizenUID(liveUID);
        setTokenFromPi(auth.accessToken); 
        addLog("Pi Core Auth Success. Checking Registry...");

        // 🛡️ THE GATEKEEPER PING
        const res = await fetch('/api/sync-citizen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ citizen_uid: liveUID })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            addLog("Pioneer Verified. Opening Vault.");
            setCurrentPhase('OPERATIONAL');
          } else {
            addLog("Unregistered UID detected. Initiating Screening.");
            setCurrentPhase('SCREENING');
          }
        } else {
          addLog("FAULT: Could not reach Postgres Vault.");
        }
      }
    } catch (error) {
      addLog("HANDSHAKE REJECTED: Connection Error.");
    }
  };

  // --- THE SCREENING LOGIC ---
  const verifyScreening = async () => {
    const isPass = acceptableKeywords.some(keyword => 
      screeningAnswer.toLowerCase().includes(keyword)
    );

    if (isPass) {
      addLog("Screening Passed. Registering Pioneer...");
      try {
        const res = await fetch('/api/register-citizen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ citizen_uid: citizenUID, status: 'ACTIVE' })
        });

        if (res.ok) {
          addLog("Registry Updated. Welcome to the Republic.");
          setCurrentPhase('OPERATIONAL');
        } else {
          setScreeningError("Vault Error: Could not save registry data.");
        }
      } catch (e) {
        setScreeningError("Network Fault during registration.");
      }
    } else {
      setScreeningError("ACCESS DENIED: Logic does not align with the E-Network ethos.");
      addLog("Screening Failed.");
    }
  };

  // =========================================================================
  // --- VIEWPORT RENDERING MATRIX ---
  // =========================================================================

  if (currentPhase === 'GENESIS') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 font-mono">
        <div className="w-full max-w-2xl border border-green-800 bg-black p-8 rounded-xl text-center">
          <h1 className="text-3xl font-black text-green-500 uppercase mb-8">Bazaar Republic</h1>
          <button onClick={executePiHandshake} className="w-full py-5 bg-green-900 text-white border border-green-500 font-bold rounded uppercase">
            Connect Pi Wallet
          </button>
          <div className="mt-8 bg-gray-900 p-4 rounded h-32 overflow-y-auto text-xs text-green-400 text-left">
            {meshLogs.map((log, i) => <div key={i}>{">_"} {log}</div>)}
          </div>
        </div>
      </div>
    );
  }

  // 🛡️ NEW VIEWPORT: SCREENING
  if (currentPhase === 'SCREENING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-4 font-mono">
        <div className="w-full max-w-2xl border border-blue-800 bg-black p-8 rounded-xl text-center">
          <h2 className="text-2xl font-black text-blue-500 uppercase mb-4">Pioneer Verification Required</h2>
          <p className="text-gray-400 mb-6 text-sm">To prevent bot infiltration, prove your alignment with the Matrix.</p>
          
          <div className="bg-gray-900 p-4 rounded mb-6 text-blue-400 text-left border border-blue-900">
            <p className="font-bold">QUESTION: {screeningQuestion}</p>
          </div>

          <input 
            type="text" 
            value={screeningAnswer}
            onChange={(e) => setScreeningAnswer(e.target.value)}
            placeholder="Enter your logic..."
            className="w-full p-4 bg-gray-900 text-white border border-gray-700 rounded mb-4 focus:outline-none focus:border-blue-500"
          />

          {screeningError && <p className="text-red-500 text-xs mb-4 uppercase">{screeningError}</p>}

          <button onClick={verifyScreening} className="w-full py-4 bg-blue-900 text-white border border-blue-500 font-bold rounded uppercase">
            Submit Protocol
          </button>
          <div className="mt-8 bg-gray-900 p-4 rounded h-32 overflow-y-auto text-xs text-green-400 text-left">
            {meshLogs.map((log, i) => <div key={i}>{">_"} {log}</div>)}
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === 'OPERATIONAL') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-4 py-10 font-mono">
        <div className="w-full max-w-4xl p-8 border border-green-800 bg-black rounded-xl">
          
          {/* 🛡️ INJECTED TREASURY SECTOR */}
          <TreasuryDashboard citizenUID={citizenUID || ""} liveAccessToken={tokenFromPi} />

          <h2 className="text-2xl font-black text-green-500 uppercase mb-4">Vault Operational</h2>
          
          {/* ... Existing Initiate Asset Transfer Button ... */}

          <HeirRegistryConsole citizenUID={citizenUID || ""} liveAccessToken={tokenFromPi} />
        </div>
      </div>
    );
  }

  if (currentPhase === 'INTERCEPT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4 font-mono">
        <div className="w-full max-w-2xl">
          <GracePeriodBuffer 
            onAuthorize={() => setCurrentPhase('OPERATIONAL')} 
            onStasis={executeDatabaseLock} 
          />
        </div>
      </div>
    );
  }

  if (currentPhase === 'STASIS') {
    return <TribunalRecoveryBridge citizenUID={citizenUID || ""} />;
  }

  return null;
}