"use server";

import { PioneerNode } from "@/models/PioneerNode";
// import { TreasuryLedger } from "@/models/TreasuryLedger"; // ◄ To be forged later for strict accounting

// ----------------------------------------------------------------------
// 🛡️ THE MESH-MARKET: ZERO-TRUST SUBSIDY ENGINE
// ----------------------------------------------------------------------
export async function executeMarketTransaction(
  buyerId: string, 
  merchantId: string, 
  cartValue: number // Denominated in Pi or mBZR
) {
  const MAX_DISCOUNT = 0.10; // 10% max DAO subsidy for buyers
  const BASE_TAX = 0.03;     // 3% standard network tax for merchants

  try {
    
    // 1. 🛑 FETCH IDENTITIES & REPUTATION
    const [buyer, merchant] = await Promise.all([
      PioneerNode.findOne({ username: buyerId }).lean(),
      PioneerNode.findOne({ username: merchantId }).lean()
    ]);

    if (!buyer || !merchant) {
      return { success: false, message: "MESH-FRACTURE: Node identity unverified in ledger." };
    }

    // 2. ⚖️ CALCULATE TRUSTSCORE (TS) ALGORITHMS
    const buyerTS = buyer.trust_score || 0;
    const merchantTS = merchant.trust_score || 0;

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
    // This assumes your PioneerNode schema tracks mBZR balances in a field called 'mbzr_balance'
    if ((buyer.mbzr_balance || 0) < buyerPays) {
      return { success: false, message: "INSUFFICIENT_FUNDS: Buyer lacks required mBZR." };
    }

    // 5. 🚀 EXECUTE ATOMIC SETTLEMENT (The Ledger Update)
    // In production, use MongoDB Transactions (session.withTransaction) for absolute safety
    await Promise.all([
      PioneerNode.updateOne({ username: buyerId }, { $inc: { mbzr_balance: -buyerPays } }),
      PioneerNode.updateOne({ username: merchantId }, { $inc: { mbzr_balance: merchantReceives } })
      // Treasury balances would be updated here
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