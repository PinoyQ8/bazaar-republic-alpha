import React, { useState, useEffect, useCallback } from 'react';

/**
 * PROJECT BAZAAR — ELDER COUNCIL EMERGENCY AID VOTING PORTAL
 * -----------------------------------------------------------------------------
 * Version: 1.0.0 (Schema v2.7.2 & Future Fund Protection Standard)
 * 
 * This component provides the secure administrative frontend for the 5 elected
 * Elders of the Bazaar Republic to review, sign, and authorize emergency social
 * and medical disbursements.
 * 
 * Safety Gates Integrated:
 * 1. Role-Based Access Control (RBAC): Strictly visible/executable only by Level-1 (ELDER) and Level-0 (FOUNDER) Passports.
 * 2. Black Swan "Future Fund" Safeguard: Visualizes the untouchable baseline floor (300,000 mBZR) and blocks approvals that threaten system survival.
 * 3. 3/5 Multisig Threshold Progress Bar: Displays real-time Elder signature tracking.
 */

export interface EmergencyAidRequest {
  id: string;
  pioneerId: string;
  walletAddress: string;
  category: 'HEALTH_MEDICAL' | 'NATURAL_DISASTER' | 'INFRASTRUCTURE' | 'HARDWARE_FAILURE' | 'FINANCIAL_DISTRESS';
  requestedAmountMBzr: bigint;
  reasonMasked: string;
  zkProofHash: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'REVOKED';
  eldersSigned: string[]; // List of Elder Wallet Addresses
  createdAt: string;
}

interface SocialPoolStats {
  totalReservesMBzr: bigint;
  futureFundFloorMBzr: bigint;
  availableLiquidMBzr: bigint;
}

interface ElderVotingPortalProps {
  currentElderAddress: string;
  userPassportTier: number; // 0 = FOUNDER, 1 = ELDER, 5 = CITIZEN etc.
}

export const ElderVotingPortal: React.FC<ElderVotingPortalProps> = ({
  currentElderAddress,
  userPassportTier
}) => {
  // State Management
  const [requests, setRequests] = useState<EmergencyAidRequest[]>([]);
  const [poolStats, setPoolStats] = useState<SocialPoolStats>({
    totalReservesMBzr: 10000000000000n, // 1,000,000.0000000 mBZR
    futureFundFloorMBzr: 3000000000000n, // 300,000.0000000 mBZR (Untouchable floor)
    availableLiquidMBzr: 7000000000000n  // 700,000.0000000 mBZR
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [signingRequest, setSigningRequest] = useState<string | null>(null);

  // Load telemetry data from our Next.js API endpoints
  const loadPortalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, these fetch directly from:
      // - /api/social/stats
      // - /api/social/requests
      
      // Simulating realistic database records seeded in bzr-db
      const mockRequests: EmergencyAidRequest[] = [
        {
          id: "66be091a1f33a82",
          pioneerId: "pioneer_uid_nitro5_active",
          walletAddress: "GD7XBZ6YRE5BXM73O7N2Z...",
          category: 'HEALTH_MEDICAL',
          requestedAmountMBzr: 500000000000n, // 50,000 mBZR
          reasonMasked: "IPFS://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
          zkProofHash: "0x8fa11cd980f76527fa11cde7",
          status: 'PENDING',
          eldersSigned: ["GD7XELDER1Address...", "GD7XELDER2Address..."],
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
        },
        {
          id: "66be0a331f33b11",
          pioneerId: "pioneer_uid_typhoon_victim",
          walletAddress: "GD7XNONREGISTREDA...",
          category: 'NATURAL_DISASTER',
          requestedAmountMBzr: 8500000000000n, // 850,000 mBZR (Breaches Future Fund Floor)
          reasonMasked: "IPFS://QmZ96mXWo6uco8fa11cd980f76527fa11cde7XoypizjW3",
          zkProofHash: "0xff77ee88dd99cc110a21bcbe",
          status: 'PENDING',
          eldersSigned: [],
          createdAt: new Date().toISOString()
        }
      ];

      setRequests(mockRequests);
    } catch (err: any) {
      setError(err.message || 'Failed to sync with local database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Handle cryptographic signature collection using local Passkey WebAuthn simulation
  const handleSignRequest = async (requestId: string, requestedAmount: bigint) => {
    setSigningRequest(requestId);
    try {
      // 🛡️ Pre-flight Black Swan Check: Enforce the Future Fund floor constraint on the client
      const projectedReserves = poolStats.totalReservesMBzr - requestedAmount;
      if (projectedReserves < poolStats.futureFundFloorMBzr) {
        throw new Error(
          `[BLACK-SWAN-BLOCKED] Payout of ${(Number(requestedAmount) / 10000000).toFixed(2)} mBZR would breach the strict 300,000.0000000 mBZR Future Fund Survival Floor! This request cannot be signed or disbursed.`
        );
      }

      // Simulate the WebAuthn Biometric passkey prompt and Stellar Auth Delegation (CAP-0071)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update the local react state to simulate immediate database write
      setRequests((prevRequests) =>
        prevRequests.map((req) => {
          if (req.id === requestId) {
            const updatedSigns = req.eldersSigned.includes(currentElderAddress)
              ? req.eldersSigned
              : [...req.eldersSigned, currentElderAddress];
            
            const isApproved = updatedSigns.length >= 3;

            return {
              ...req,
              eldersSigned: updatedSigns,
              status: isApproved ? 'APPROVED' : req.status
            };
          }
          return req;
        })
      );

      alert("🛡️ Cryptographic passkey signature recorded! Node state securely synchronized.");
    } catch (err: any) {
      alert(err.message || "Signature registration failed.");
    } finally {
      setSigningRequest(null);
    }
  };

  // Helper: Convert BigInt mBZR to formatted string
  const formatMBzr = (val: bigint): string => {
    return (Number(val) / 10000000).toLocaleString(undefined, {
      minimumFractionDigits: 7,
      maximumFractionDigits: 7
    }) + " mBZR";
  };

  // Security Guard Layout for Citizens attempting to access Elder controls
  if (userPassportTier > 1) {
    return (
      <div className="p-8 bg-slate-900 border border-red-500/30 rounded-xl text-center max-w-2xl mx-auto my-12">
        <h2 className="text-2xl font-bold text-red-500 mb-4">⛔ Access Denied</h2>
        <p className="text-slate-300">
          Your active Sovereign Passport does not possess Level-1 (ELDER) or Level-0 (FOUNDER) clearance. 
          The Emergency Mutual Aid Voting Portal is strictly reserved for the elected 5-Elder Council to protect treasury allocations.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-indigo-400 flex items-center gap-2">
            🏛️ Elder Council Emergency Aid Portal
          </h1>
          <p className="text-slate-400 mt-1">
            Review, authorize, and sign emergency social and medical relief grants under Schema v2.7.2.
          </p>
        </div>
        <div className="bg-indigo-950/40 border border-indigo-500/20 px-4 py-2 rounded-lg text-sm text-indigo-300">
          <span className="font-semibold">Active Session:</span> {currentElderAddress.slice(0, 12)}...
        </div>
      </div>

      {/* METRIC CARD BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-sm text-slate-400">Total Social Pool Reserves</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{formatMBzr(poolStats.totalReservesMBzr)}</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-red-900/30 p-5 rounded-xl relative overflow-hidden">
          <div className="text-sm text-red-400 flex items-center gap-1.5 font-semibold">
            🛡️ Future Fund Survival Floor
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1">{formatMBzr(poolStats.futureFundFloorMBzr)}</div>
          <div className="text-xs text-red-500/80 mt-2">
            Strictly untouchable during black swan events to guarantee network survival.
          </div>
        </div>

        <div className="bg-slate-900 border border-indigo-950 p-5 rounded-xl">
          <div className="text-sm text-indigo-300">Liquid Disbursable Fund</div>
          <div className="text-2xl font-bold text-indigo-300 mt-1">{formatMBzr(poolStats.availableLiquidMBzr)}</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>

      {/* EMERGENCY REQUESTS BOARD */}
      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
          📥 Active Emergency Aid Queue
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Synchronizing database...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400">
            No active emergency aid requests in the voting queue.
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((req) => {
              const isEldersSigned = req.eldersSigned.includes(currentElderAddress);
              const signatureCount = req.eldersSigned.length;
              const percentComplete = (signatureCount / 5) * 100;
              const willBreachFloor = poolStats.totalReservesMBzr - req.requestedAmountMBzr < poolStats.futureFundFloorMBzr;

              return (
                <div 
                  key={req.id} 
                  className={`bg-slate-900 border rounded-xl overflow-hidden shadow-lg ${
                    willBreachFloor ? 'border-red-900/50' : 'border-slate-800'
                  }`}
                >
                  {/* TOP WARNING BANNER FOR BLACK SWANS */}
                  {willBreachFloor && (
                    <div className="bg-red-950/80 border-b border-red-800/40 px-5 py-3 text-red-400 text-sm font-semibold flex items-center gap-2 animate-pulse">
                      🚨 BLACK SWAN DETECTED: This payout breaches the Future Fund&apos;s survival baseline floor of {formatMBzr(poolStats.futureFundFloorMBzr)}! Approval is locked.
                    </div>
                  )}

                  <div className="p-6">
                    {/* REQUEST TOP BLOCK */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-4 gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold text-slate-100">
                            Grant Request #{req.id.slice(0, 8)}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            req.category === 'HEALTH_MEDICAL' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20' :
                            req.category === 'NATURAL_DISASTER' ? 'bg-amber-950/80 text-amber-400 border border-amber-500/20' :
                            'bg-indigo-950/80 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {req.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Submitted At: {new Date(req.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Requested Payout Amount</div>
                        <div className={`text-xl font-black ${willBreachFloor ? 'text-red-500' : 'text-slate-100'}`}>
                          {formatMBzr(req.requestedAmountMBzr)}
                        </div>
                      </div>
                    </div>

                    {/* METADATA LIST */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-slate-400 block text-xs">Cryptographic Pioneer ID</span>
                          <span className="text-slate-200 font-mono text-xs block truncate bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                            {req.pioneerId}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-xs">Target Wallet Address</span>
                          <span className="text-slate-200 font-mono text-xs block truncate bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                            {req.walletAddress}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <span className="text-slate-400 block text-xs">Encrypted Case Documentation (IPFS Mask)</span>
                          <span className="text-indigo-400 font-mono text-xs block truncate bg-slate-950 p-2 rounded border border-indigo-950/50 mt-1">
                            {req.reasonMasked}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-xs">ZK-Proof Validation Hash (Zero Knowledge)</span>
                          <span className="text-emerald-400 font-mono text-xs block truncate bg-slate-950 p-2 rounded border border-emerald-950/50 mt-1">
                            {req.zkProofHash}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE MULTISIG INTERFACE */}
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="w-full md:w-2/3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-400">3/5 Council Signature Threshold</span>
                          <span className="text-xs font-bold text-indigo-400">{signatureCount}/5 Signed</span>
                        </div>
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              signatureCount >= 3 ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${percentComplete}%` }}
                          ></div>
                        </div>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {req.eldersSigned.map((sign, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                              Elder #{sign.slice(12, 16)} signed
                            </span>
                          ))}
                          {req.eldersSigned.length === 0 && (
                            <span className="text-[10px] text-slate-500 italic">No signatures recorded yet</span>
                          )}
                        </div>
                      </div>

                      <div className="w-full md:w-auto text-right">
                        <button
                          onClick={() => handleSignRequest(req.id, req.requestedAmountMBzr)}
                          disabled={signingRequest !== null || isEldersSigned || willBreachFloor}
                          className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all ${
                            willBreachFloor 
                              ? 'bg-red-950 text-red-500 border border-red-900/40 cursor-not-allowed'
                              : isEldersSigned 
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                : signingRequest === req.id
                                  ? 'bg-indigo-950 text-indigo-300 cursor-wait'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20 active:scale-95'
                          }`}
                        >
                          {willBreachFloor 
                            ? 'Floor Blocked' 
                            : isEldersSigned 
                              ? 'Signed ✓' 
                              : signingRequest === req.id 
                                ? 'Signing via Passkey...' 
                                : 'Sign & Authorize'}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
