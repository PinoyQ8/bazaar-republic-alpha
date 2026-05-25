"use client";

import { useState } from 'react';

export default function PledgeTerminal() {
    const [wallet, setWallet] = useState("");
    const [log, setLog] = useState("Awaiting Pioneer Uplink...");
    const [metrics, setMetrics] = useState({ trust: 0, impact: 0 });
    const [isTransmitting, setIsTransmitting] = useState(false);

    // 🚨 MESH-CORE: The Frontend execution of the Pledge API
    const executePledge = async (taskId: string) => {
        if (!wallet) {
            setLog("❌ ERROR: Wallet address required for uplink.");
            return;
        }

        setIsTransmitting(true);
        setLog(`⏳ Transmitting Proof-of-Contribution [${taskId}] to the Oracle...`);

        try {
            const response = await fetch('/api/pledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet_address: wallet, task_id: taskId })
            });

            const data = await response.json();

            if (!response.ok) {
                setLog(`❌ GOVERNANCE LOCK: ${data.error}`);
            } else {
                setLog(`✅ VERIFIED: [${taskId}] accepted. Trust Healed.`);
                setMetrics(prev => ({
                    trust: data.new_trust_score,
                    impact: prev.impact + data.impact_awarded
                }));
            }
        } catch (error) {
            setLog("❌ CRITICAL: Uplink to the MESH severed.");
        } finally {
            setIsTransmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-black text-green-500 font-mono border border-green-800 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.2)]">
            <h2 className="text-2xl font-bold mb-4 border-b border-green-800 pb-2">🛡️ MESH PLEDGE TERMINAL</h2>
            
            <div className="mb-6">
                <label className="block text-sm mb-2 text-green-400">TARGET WALLET NODE</label>
                <input 
                    type="text" 
                    placeholder="Enter Pioneer Wallet Address (GBTY...)"
                    className="w-full p-3 bg-gray-900 border border-green-700 rounded text-white focus:outline-none focus:border-green-400"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* 🚨 THE TASK LEDGER BUTTONS */}
                <button 
                    onClick={() => executePledge("NODE_UPTIME")}
                    disabled={isTransmitting}
                    className="p-3 border border-green-600 hover:bg-green-900 transition-colors disabled:opacity-50 text-left"
                >
                    <span className="block font-bold">NODE UPTIME</span>
                    <span className="text-xs text-green-400">+10 Impact | +5 Trust</span>
                </button>
                <button 
                    onClick={() => executePledge("SECURITY_AUDIT")}
                    disabled={isTransmitting}
                    className="p-3 border border-yellow-600 hover:bg-yellow-900 text-yellow-500 transition-colors disabled:opacity-50 text-left"
                >
                    <span className="block font-bold">SECURITY AUDIT</span>
                    <span className="text-xs text-yellow-400">+50 Impact | +15 Trust</span>
                </button>
                <button 
                    onClick={() => executePledge("CODE_REVIEW")}
                    disabled={isTransmitting}
                    className="p-3 border border-blue-600 hover:bg-blue-900 text-blue-500 transition-colors disabled:opacity-50 text-left"
                >
                    <span className="block font-bold">CODE REVIEW</span>
                    <span className="text-xs text-blue-400">+20 Impact | +10 Trust</span>
                </button>
                <button 
                    onClick={() => executePledge("MERCHANT_ONBOARD")}
                    disabled={isTransmitting}
                    className="p-3 border border-purple-600 hover:bg-purple-900 text-purple-500 transition-colors disabled:opacity-50 text-left"
                >
                    <span className="block font-bold">MERCHANT ONBOARD</span>
                    <span className="text-xs text-purple-400">+25 Impact | +10 Trust</span>
                </button>
            </div>

            <div className="bg-gray-900 p-4 border border-green-800 rounded mb-4">
                <span className="block text-xs text-gray-400 mb-1">SYSTEM LOG:</span>
                <span className="font-bold">{log}</span>
            </div>

            <div className="flex justify-between text-sm bg-black p-3 border-t border-green-800">
                <span>LOCAL TRUST SCORE: <span className="font-bold text-white">{metrics.trust || "---"}</span></span>
                <span>LOCAL IMPACT: <span className="font-bold text-white">{metrics.impact || "---"}</span></span>
            </div>
        </div>
    );
}