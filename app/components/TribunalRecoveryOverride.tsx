"use client";
import { useState, useEffect } from 'react';

export default function TribunalRecoveryOverride() {
  const [tribunalState, setTribunalState] = useState<string>('idle');
  const [signatures, setSignatures] = useState<number>(0);

  const initiateTribunalRequest = () => {
    setTribunalState('pending');
    console.log("MESH-SCAN: Tribunal Initiated. 5 Nodes Pinged.");
  };

  useEffect(() => {
    // Explicitly typing the timer for the Node/Browser environment
    let timer: ReturnType<typeof setTimeout>;
    
    if (tribunalState === 'pending' && signatures < 3) {
      timer = setTimeout(() => {
        setSignatures((prev) => prev + 1);
      }, 4000); 
    } else if (signatures >= 3 && tribunalState === 'pending') {
      setTribunalState('resolved');
      console.log("MESH-SCAN: 3/5 Consensus Reached. Hash Bypassed.");
    }
    return () => clearTimeout(timer);
  }, [tribunalState, signatures]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-8">
      <div className="w-full max-w-87.5 bg-black border border-gray-800 rounded-lg p-6 shadow-2xl">
        
        <h2 className="text-purple-500 font-bold tracking-widest uppercase text-lg mb-4 border-b border-gray-800 pb-2">
          DAO Tribunal Override
        </h2>

        {tribunalState === 'idle' && (
          <div className="animate-fade-in">
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Cryptographic hash unavailable. To bind your new wallet and recover assets, you must request a manual Identity Audit from 5 Real Pioneers.
            </p>
            <button 
              onClick={initiateTribunalRequest}
              className="w-full py-4 bg-purple-700 hover:bg-purple-600 text-white font-bold tracking-widest rounded transition-colors uppercase"
            >
              Request Peer Audit
            </button>
          </div>
        )}

        {tribunalState === 'pending' && (
          <div className="text-center animate-fade-in">
            <p className="text-yellow-500 font-bold uppercase tracking-widest mb-4 animate-pulse">
              Awaiting Consensus
            </p>
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3].map((nodeNum) => (
                <div 
                  key={nodeNum}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    signatures >= nodeNum 
                      ? 'bg-green-600 border-green-400 shadow-[0_0_15px_rgba(22,163,74,0.5)]' 
                      : 'bg-gray-900 border-gray-700'
                  }`}
                >
                  {signatures >= nodeNum ? '✓' : nodeNum}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              {signatures} / 3 Signatures Secured
            </p>
          </div>
        )}

        {tribunalState === 'resolved' && (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(22,163,74,0.8)]">
              <span className="text-white text-3xl font-black">✓</span>
            </div>
            <h3 className="text-green-400 font-bold uppercase tracking-widest mb-2">
              Override Authorized
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              The E-Network has verified your identity. Your new wallet address is now bound to your MESH profile.
            </p>
            <button className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-extrabold tracking-widest rounded transition-colors uppercase">
              Reclaim Assets
            </button>
          </div>
        )}

      </div>
    </div>
  );
}