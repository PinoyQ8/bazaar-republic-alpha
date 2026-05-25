"use client";
import { useState, useEffect } from 'react';

// TypeScript Interface for routing to the next MESH phase
interface GenesisProps {
  onVaultSecured: () => void;
}

export default function GenesisLockOnboarding({ onVaultSecured }: GenesisProps) {
  // --- STATE MEMORY ---
  const [step, setStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [meshLogs, setMeshLogs] = useState<string[]>([]);

  // --- TERMINAL LOGGING LOGIC ---
  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  useEffect(() => {
    addLog("System Boot: Genesis Lock Node Active.");
    addLog("Awaiting Pioneer authorization to forge Republic Vault Key.");
  }, []);

  // --- 256-BIT ENTROPY FORGE (Sanitized for Demo) ---
  const generateVaultKey = () => {
    setIsProcessing(true);
    addLog("WARNING: Generating 256-bit cryptographic entropy.");
    addLog("BIP39 Protocol initialized. Forging 24-word matrix...");

    // MOCKED LOGIC: Simulating the secure client-side generation.
    // In the private repo, this is replaced with: require('bip39').generateMnemonic(256)
    setTimeout(() => {
      const demoMatrix = [
        "abstract", "barrier", "cabbage", "damp", "echo", "fabric", 
        "garment", "habit", "ice", "jacket", "kangaroo", "labor", 
        "machine", "narrow", "obey", "package", "quality", "radar", 
        "saddle", "tackle", "umbrella", "vacuum", "wagon", "yacht"
      ];
      setMnemonic(demoMatrix);
      setStep(1);
      setIsProcessing(false);
      addLog("SUCCESS: Republic Vault Key forged locally.");
      addLog("Awaiting physical analog backup by Pioneer.");
    }, 2800); // Simulated cryptographic calculation time
  };

  // --- VIEWPORT RENDERING ---
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono">
      
      <div className="w-full max-w-2xl border border-green-900 bg-black p-8 rounded-xl shadow-[0_0_30px_rgba(20,83,45,0.4)] flex flex-col items-center">
        
        {/* Header Alert */}
        <div className="text-center mb-8 w-full border-b border-green-900 pb-4">
          <h2 className="text-green-500 font-black tracking-widest uppercase text-2xl">
            Genesis Lock: Initialization
          </h2>
          <p className="text-gray-400 text-xs mt-2 uppercase tracking-wider">
            Type-2 Defense Node • 256-Bit Entropy Protocol
          </p>
        </div>

        {/* PHASE 0: PRE-GENERATION WARNING */}
        {step === 0 && (
          <div className="w-full text-center">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded mb-8 text-sm text-gray-300 leading-relaxed text-left">
              <p className="mb-4">
                <span className="text-red-500 font-bold uppercase">Critical Directive:</span> You are about to generate your <strong>Republic Vault Key</strong>. This is a 24-word, mathematically secure matrix that binds your local node to the Vercel Bridge.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>This key acts as <strong>Key A</strong> in the MESH Multi-Sig architecture.</li>
                <li>It strictly protects assets inside the E-Network stasis shield.</li>
                <li>The logic executes entirely on your device. The Vercel Bridge will never see these words.</li>
              </ul>
            </div>

            <button 
              onClick={generateVaultKey}
              disabled={isProcessing}
              className={`w-full py-4 font-extrabold text-lg tracking-widest rounded transition-all uppercase ${
                isProcessing 
                  ? 'bg-yellow-700 text-yellow-200 cursor-wait' 
                  : 'bg-green-700 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]'
              }`}
            >
              {isProcessing ? "Forging Vault Key..." : "Initiate 256-Bit Forge"}
            </button>
          </div>
        )}

        {/* PHASE 1: THE 24-WORD MATRIX */}
        {step === 1 && (
          <div className="w-full">
            <p className="text-yellow-500 text-xs text-center mb-6 uppercase tracking-widest animate-pulse">
              Write these 24 words down offline. Do not screenshot.
            </p>
            
            {/* The 24-Word Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {mnemonic.map((word, index) => (
                <div key={index} className="bg-gray-900 border border-gray-700 p-3 rounded flex items-center shadow-inner">
                  <span className="text-gray-600 text-xs font-bold w-6">{index + 1}.</span>
                  <span className="text-green-400 font-bold tracking-wide">{word}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                addLog("Pioneer verification complete. Genesis Lock sealed.");
                onVaultSecured();
              }}
              className="w-full py-4 bg-transparent border-2 border-green-700 text-green-500 hover:bg-green-900 hover:text-white font-bold tracking-widest uppercase rounded transition-colors"
            >
              I Have Secured My Republic Vault Key
            </button>
          </div>
        )}

        {/* MESH Terminal Output */}
        <div className="mt-8 w-full bg-gray-900 p-3 rounded h-28 overflow-y-auto border border-gray-800 text-[10px] text-gray-500">
          {meshLogs.map((log, index) => (
             <div key={index} className="mb-1">{log}</div>
          ))}
        </div>

      </div>
    </div>
  );
}