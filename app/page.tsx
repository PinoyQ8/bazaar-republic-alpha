"use client";

import TribunalRecoveryBridge from './components/TribunalRecoveryBridge';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import HeirRegistryConsole from './components/HeirRegistryConsole';
import TreasuryDashboard from './components/TreasuryDashboard';

declare global {
  interface Window {
    Pi: any;
  }
}

type MeshPhase = 'GENESIS' | 'SCREENING' | 'OPERATIONAL' | 'INTERCEPT' | 'STASIS';

// --- GRACE PERIOD COMPONENT (Embedded) ---
interface GracePeriodProps {
  onAuthorize: () => void;
  onStasis: () => void;
}

function GracePeriodBuffer({ onAuthorize, onStasis }: GracePeriodProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  useEffect(() => {
    if (timeLeft <= 0) { onAuthorize(); return; }
    const timerInterval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerInterval);
  }, [timeLeft, onAuthorize]);

  return (
    <div className="w-full flex flex-col items-center border border-yellow-500/50 bg-black p-6 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.2)]">
      <div className="flex items-center justify-center gap-3 mb-4 text-yellow-500 font-bold uppercase tracking-widest">Interception Shield Active</div>
      <div className="text-6xl font-black text-yellow-500 mb-8 font-mono">00:{timeLeft.toString().padStart(2, '0')}</div>
      <div className="w-full grid grid-cols-1 gap-4">
        <button onClick={onAuthorize} className="w-full py-4 bg-green-900 text-green-400 font-bold uppercase rounded border border-green-500">Authorize Now</button>
        <button onClick={onStasis} className="w-full py-4 bg-red-900 text-white font-black uppercase rounded border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]">Engage Stasis</button>
      </div>
    </div>
  );
}

export default function RepublicMasterNode() {
  const [tokenFromPi, setTokenFromPi] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<MeshPhase>('GENESIS');
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [citizenUID, setCitizenUID] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]); // 🛡️ NEW: LOG PERSISTENCE RAM
  const sdkInitialized = useRef(false);

  const [screeningAnswer, setScreeningAnswer] = useState<string>("");
  const [screeningError, setScreeningError] = useState<string>("");
  const [uptimeShield, setUptimeShield] = useState(94.78);

  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  // 🛡️ 1. THE PERSISTENCE HANDSHAKE (Auto-Sync on Load)
  useEffect(() => {
    const performMeshHandshake = async () => {
      if (!citizenUID) return;
      addLog("MESH: Initiating Handshake with Postgres Core...");

      try {
        const res = await fetch('/api/sync-citizen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ citizen_uid: citizenUID })
        });
        const data = await res.json();

        if (data.status === "SUCCESS") {
          if (data.vault_status) {
            setCurrentPhase(data.vault_status);
            setUptimeShield(data.uptime_shield);
            setAuditLogs(data.logs || []);
            addLog(`MESH: Handshake Verified. Phase: ${data.vault_status}`);
          }
        } else if (data.message === "NEW_CITIZEN") {
          setCurrentPhase('SCREENING');
          addLog("MESH: Unregistered UID. Screening Required.");
        }
      } catch (error) {
        addLog("FAULT: Handshake Interrupted.");
      }
    };
    performMeshHandshake();
  }, [citizenUID]);

  // 🛡️ 2. AUTHENTICATION LOGIC
  const executePiHandshake = async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      addLog("FOUNDER OVERRIDE: Desktop Diagnostic Mode.");
      setCitizenUID("SYS_ADMIN_X570");
      setTokenFromPi("DESKTOP_MOCK_TOKEN");
      return;
    }

    try {
      if (!sdkInitialized.current) {
        window.Pi.init({ version: "2.0", sandbox: true });
        sdkInitialized.current = true;
      }
      const auth = await window.Pi.authenticate(['username', 'payments'], (incomplete: any) => {});
      if (auth && auth.user) {
        setCitizenUID(auth.user.uid);
        setTokenFromPi(auth.accessToken);
      }
    } catch (error) {
      addLog("HANDSHAKE REJECTED.");
    }
  };

  // 🛡️ 3. SCREENING LOGIC
  const verifyScreening = async () => {
    const acceptable = ["decentralization", "web3", "pioneer", "security", "dao", "freedom", "ecosystem"];
    const isPass = acceptable.some(k => screeningAnswer.toLowerCase().includes(k));

    if (isPass) {
      addLog("Logic Aligned. Registering Pioneer...");
      const res = await fetch('/api/register-citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_uid: citizenUID, status: 'OPERATIONAL' })
      });
      if (res.ok) setCurrentPhase('OPERATIONAL');
    } else {
      setScreeningError("LOGIC MISALIGNMENT DETECTED.");
    }
  };

  const executeDatabaseLock = async () => {
    try {
      const res = await fetch('/api/engage-stasis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_uid: citizenUID }),
      });
      if (res.ok) setCurrentPhase('STASIS');
    } catch (e) { addLog("LOCK FAULT."); }
  };

  // =========================================================================
  // VIEWPORT MATRIX
  // =========================================================================

  if (currentPhase === 'GENESIS') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-4 font-mono">
        <div className="w-full max-w-2xl border border-green-800 bg-black p-8 rounded-xl text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          <h1 className="text-4xl font-black text-green-500 mb-8 tracking-tighter">BAZAAR REPUBLIC</h1>
          <button onClick={executePiHandshake} className="w-full py-5 bg-green-900/20 hover:bg-green-900 text-green-400 border border-green-500 font-bold rounded transition-all">CONNECT PI WALLET</button>
          <div className="mt-8 bg-black border border-gray-800 p-4 rounded h-32 overflow-y-auto text-[10px] text-green-600 text-left">
            {meshLogs.map((log, i) => <div key={i}>{">_"} {log}</div>)}
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === 'SCREENING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-4 font-mono">
        <div className="w-full max-w-2xl border border-blue-800 bg-black p-8 rounded-xl text-center">
          <h2 className="text-xl font-black text-blue-500 uppercase mb-6">Pioneer Verification</h2>
          <p className="text-xs text-blue-400 mb-6 bg-blue-900/10 p-4 border border-blue-900/30">QUESTION: What is the goal of the E-Network?</p>
          <input type="text" value={screeningAnswer} onChange={(e) => setScreeningAnswer(e.target.value)} placeholder="Logic..." className="w-full p-4 bg-gray-950 border border-gray-800 text-white rounded mb-4 outline-none focus:border-blue-500"/>
          {screeningError && <p className="text-red-500 text-[10px] mb-4">{screeningError}</p>}
          <button onClick={verifyScreening} className="w-full py-4 bg-blue-900/20 hover:bg-blue-900 text-blue-400 border border-blue-500 font-bold rounded">SUBMIT PROTOCOL</button>
        </div>
      </div>
    );
  }

  if (currentPhase === 'OPERATIONAL') {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-950 px-4 py-10 font-mono text-left">
        <div className="w-full max-w-4xl">
          <TreasuryDashboard citizenUID={citizenUID || ""} liveAccessToken={tokenFromPi} />
          <HeirRegistryConsole citizenUID={citizenUID || ""} liveAccessToken={tokenFromPi} />
        </div>
      </div>
    );
  }

  if (currentPhase === 'INTERCEPT') {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4 font-mono"><GracePeriodBuffer onAuthorize={() => setCurrentPhase('OPERATIONAL')} onStasis={executeDatabaseLock} /></div>;
  }

  if (currentPhase === 'STASIS') {
    return <TribunalRecoveryBridge citizenUID={citizenUID || ""} />;
  }

  return null;
}