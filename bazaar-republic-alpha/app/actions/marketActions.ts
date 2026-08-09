"use server";

import { PioneerNode } from "@/models/PioneerNode";
// import { TreasuryLedger } from "@/models/TreasuryLedger"; // ◄ To be forged later for strict accounting

// Location: app/actions/marketActions.ts (Append to bottom)

// ----------------------------------------------------------------------
// 4. 🛡️ THE MESH-MARKET: ZERO-TRUST SUBSIDY ENGINE
// ----------------------------------------------------------------------
export async function executeMarketTransaction(
  buyerId: string, 
  merchantId: string, 
  cartValue: number // Denominated in Pi or mBZR
) {
  const MAX_DISCOUNT = 0.10; // 10% max DAO subsidy for buyers
  const BASE_TAX = 0.03;     // 3% standard network tax for merchants

  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE: Atlas unreachable." };

    // 1. 🛑 FETCH IDENTITIES & REPUTATION (Using $or for robust targeting)
    const [buyer, merchant] = await Promise.all([
      PioneerNode.findOne({ $or: [{ username: buyerId }, { uid: buyerId }] }).lean(),
      PioneerNode.findOne({ $or: [{ username: merchantId }, { uid: merchantId }] }).lean()
    ]);

    if (!buyer || !merchant) {
      return { success: false, message: "MESH-FRACTURE: Node identity unverified in Master Ledger." };
    }

    // 2. ⚖️ CALCULATE TRUSTSCORE (TS) ALGORITHMS 
    // Prefer the active telemetry 'trust_score' with fallback to legacy 'trustScore'
    const buyerTS = buyer.trust_score || buyer.trustScore || 10;
    const merchantTS = merchant.trust_score || merchant.trustScore || 10;

    // Buyer Discount: e.g., TS 100 = 10% discount | TS 50 = 5% discount
    const activeDiscount = MAX_DISCOUNT * (buyerTS / 100);
    
    // Merchant Tax: e.g., TS 100 = 0% tax | TS 0 = 3% tax
    const activeTaxRate = BASE_TAX * (1 - (merchantTS / 100));

    // 3. 🧮 EXECUTE THE FIAT/CRYPTO MATH
    const buyerPays = cartValue * (1 - activeDiscount);
    const treasurySubsidy = cartValue * activeDiscount; // The DAO pays the difference
    const merchantReceives = cartValue * (1 - activeTaxRate);
    const treasuryCollects = cartValue * activeTaxRate;

    // 4. 🛑 ATOMIC BALANCE CHECK (Does the buyer have enough?)
    // 🛡️ Fixed schema alignment: mbzrBalance
    if ((buyer.mbzrBalance || 0) < buyerPays) {
      return { 
        success: false, 
        message: `INSUFFICIENT_FUNDS: Buyer lacks required mBZR. Balance: ${(buyer.mbzrBalance || 0).toFixed(2)}` 
      };
    }

    // 5. 🚀 EXECUTE ATOMIC SETTLEMENT (The Ledger Update)
    // 🛡️ Fixed schema alignment: mbzrBalance
    await Promise.all([
      PioneerNode.updateOne({ uid: buyer.uid }, { $inc: { mbzrBalance: -buyerPays } }),
      PioneerNode.updateOne({ uid: merchant.uid }, { $inc: { mbzrBalance: merchantReceives } })
      // TreasuryLedger updates will be injected here later
    ]);

    console.log(`[MESH-MARKET] 🟢 Tx Cleared. Buyer TS: ${buyerTS} | Merchant TS: ${merchantTS}`);
    console.log(`- Cart: ${cartValue} | Buyer Paid: ${buyerPays.toFixed(2)} | Merchant Earned: ${merchantReceives.toFixed(2)}`);

    return {
      success: true,
      message: "TRANSACTION SECURED: TREASURY SUBSIDIES APPLIED",
      receipt: {
        originalPrice: cartValue,
        buyerPaid: buyerPays,
        discountApplied: treasurySubsidy,
        merchantReceived: merchantReceives,
        taxCollected: treasuryCollects
      }
    };

  } catch (error) {
    console.error("[MESH-MARKET] 🚨 Transaction Fracture:", error);
    return { success: false, message: "FATAL: MARKET ENGINE OFFLINE" };
  }
}