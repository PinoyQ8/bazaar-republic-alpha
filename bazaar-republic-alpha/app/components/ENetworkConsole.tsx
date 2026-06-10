"use client";

import { useState } from "react";

export default function ENetworkConsole() {
  const [txStatus, setTxStatus] = useState<string>("STANDBY");
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("1.0");

  const executePiPayment = async () => {
    // 🛡️ ADJUDICATOR VERIFICATION: Verify native SDK existence
    if (typeof window === "undefined" || !window.Pi) {
      console.error("[MESH FRACTURE] Native Pi SDK missing from runtime window context.");
      setTxStatus("ERROR_SDK_MISSING");
      return;
    }

    setTxStatus("INITIALIZING_PAYMENT");

    // 🚀 COMMERCE PAYLOAD CONFIGURATION
    const paymentData = {
      amount: parseFloat(paymentAmount),
      memo: `Bazaar E-Network Node Allocation: Lease Layer Alpha`,
      metadata: { 
        sector: "E_NETWORK_POS", 
        nodeType: "VIRTUAL_MARKET_LEAD" 
      },
      identifier: `mesh_pos_${Date.now()}`
    };

    // 🔐 INSULATED HANDSHAKE BYPASS: Cast to 'any' locally to bypass tight global.d.ts property restrictions
    const callbacks: any = {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log(`[MESH BRIDGE] Phase 2: Intercepted Payment ID: ${paymentId}. Forwarding to X570 Backend...`);
        setTxStatus("PENDING_SERVER_APPROVAL");

        try {
          const response = await fetch("/api/payments/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          });

          if (!response.ok) {
            throw new Error("X570 Node Adjudicator rejected approval parameters.");
          }

          console.log("[MESH BRIDGE] Phase 3: Backend server signed verification envelope cleanly.");
          setTxStatus("USER_PASSKEY_PROMPT");
        } catch (error) {
          console.error("[MESH FRACTURE] Handshake Phase 2/3 Breakout Failure:", error);
          setTxStatus("SERVER_APPROVAL_FAILED");
        }
      },

      onReadyForServerConfirmation: async (paymentId: string) => {
        console.log(`[MESH BRIDGE] Phase 4: Server signature processing detected for Payment ID: ${paymentId}`);
        setTxStatus("SETTLING_ON_CHAIN");

        try {
          const response = await fetch("/api/payments/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          });

          if (!response.ok) {
            throw new Error("Server settlement execution rejected.");
          }

          const completionData = await response.json();
          if (completionData.success) {
            console.log("[MESH BRIDGE] Phase 5: Transaction fully settled on-chain and locked in local DB.");
            setTxStatus("SETTLEMENT_SUCCESS");
            if (completionData.txid) {
              setActiveTxId(completionData.txid);
            }
          }
        } catch (error) {
          console.error("[MESH FRACTURE] Settlement Completion Tracking Fault:", error);
          setTxStatus("COMPLETION_LOGGING_FAILED");
        }
      },

      onCancel: (paymentId: string) => {
        console.warn(`[MESH BRIDGE] Transaction Aborted by operator. ID Reference: ${paymentId}`);
        setTxStatus("CANCELLED_BY_USER");
      },

      onError: (error: any, paymentId: string) => {
        console.error(`[MESH BRIDGE] Critical Platform Wallet Error. ID Reference: ${paymentId}`, error);
        setTxStatus("WALLET_ERROR_STATE");
      }
    };

    // Execute the transaction passing our untyped configuration structure
    window.Pi.createPayment(paymentData, callbacks);
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-amber-500 shadow-xl max-w-90 mx-auto">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-4">
        <span className="font-bold text-neutral-400">🤖 E-NETWORK TERMINAL</span>
        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${
          txStatus === "SETTLEMENT_SUCCESS" ? "bg-emerald-950 text-emerald-400" : "bg-neutral-800 text-amber-500"
        }`}>
          {txStatus}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">
            Allocation Cost Tiers (Test-Pi)
          </label>
          <input 
            type="number" 
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            disabled={txStatus !== "STANDBY" && txStatus !== "SETTLEMENT_SUCCESS" && txStatus !== "CANCELLED_BY_USER"}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-amber-400 focus:outline-none focus:border-amber-500 font-bold transition-all text-sm"
          />
        </div>

        <button
          onClick={executePiPayment}
          disabled={txStatus === "INITIALIZING_PAYMENT" || txStatus === "PENDING_SERVER_APPROVAL" || txStatus === "USER_PASSKEY_PROMPT"}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-black py-2.5 px-4 rounded transition-all tracking-wider text-xs uppercase"
        >
          {txStatus === "PENDING_SERVER_APPROVAL" || txStatus === "USER_PASSKEY_PROMPT" 
            ? "Syncing Matrix..." 
            : "Deploy Node Settlement"}
        </button>

        {activeTxId && (
          <div className="mt-2 p-2 bg-neutral-950 border border-neutral-800/80 rounded break-all text-[9px] text-neutral-400">
            <span className="text-emerald-500 font-bold">LEDGER HASH:</span> {activeTxId}
          </div>
        )}
      </div>
    </div>
  );
}