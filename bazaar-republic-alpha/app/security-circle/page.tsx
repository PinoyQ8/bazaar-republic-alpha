"use client";

import { useState } from 'react';
// 🛡️ ADJUDICATOR: Rerouted to the centralized security logic
import { verifySecurityCircleSwap } from '@/app/actions/security';

export default function SecurityCirclePortal() {
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');

  const handleValidation = async () => {
    if (!txHash) return;
    
    setStatus('VERIFYING');
    // Using a placeholder UID; in production, link this to your Auth context
    const pioneerUid = "CURRENT_SESSION_USER"; 
    
    const result = await verifySecurityCircleSwap(pioneerUid, txHash);
    
    if (result.success) {
      setStatus('SUCCESS');
      setMessage(result.message);
    } else {
      setStatus('ERROR');
     // 🛡️ ADJUDICATOR: Mapping error output to the defined 'message' schema
setStatus('ERROR');
setMessage("Fracture detected: " + (result.message || "Invalid Swap"));
    }
  };

  return (
    <div className="mesh-portal-container">
      <h1 className="text-2xl font-bold">Security Circle Validator</h1>
      <div className="validator-box mt-4">
        <input 
          className="border p-2 rounded"
          type="text" 
          placeholder="Enter 0.1 Test-Pi TxHash" 
          onChange={(e) => setTxHash(e.target.value)} 
        />
        <button 
          className="ml-2 bg-blue-600 text-white p-2 rounded"
          onClick={handleValidation} 
          disabled={status === 'VERIFYING'}
        >
          {status === 'VERIFYING' ? 'Adjudicating...' : 'Submit Validator Shield'}
        </button>
      </div>
      
      {status === 'SUCCESS' && <div className="mt-4 p-4 bg-green-900 text-green-100">{message}</div>}
      {status === 'ERROR' && <div className="mt-4 p-4 bg-red-900 text-red-100">{message}</div>}
    </div>
  );
}