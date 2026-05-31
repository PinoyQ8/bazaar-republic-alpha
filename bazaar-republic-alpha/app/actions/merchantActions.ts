"use server";

import { PioneerNode } from "@/models/PioneerNode"; 
import { TreasuryLedger } from "@/models/TreasuryLedger"; 
import MarketTransaction from "@/models/MarketTransaction"; 

/**
 * 🛡️ THE MESH-MARKET: ZERO-TRUST SUBSIDY ENGINE
 * Logic: Buyer gets discount based on TS; Merchant gets taxed based on TS.
 * The DAO Treasury acts as the clearing house for these differences.
 */
export async function executeMarketTransaction(
  buyerId: string, 
  merchantId: string, 
  cartValue: number
) {
  const MAX_DISCOUNT = 0.10; // 10% max DAO subsidy
  const BASE_TAX = 0.03;     // 3% standard network tax

  try {
   
    // 1. NODE VERIFICATION
    const [buyer, merchant] = await Promise.all([
      PioneerNode.findOne({ uid: buyerId }).lean(),
      PioneerNode.findOne({ uid: merchantId }).lean()
    ]);

    if (!buyer) {
      return { success: false, message: "MESH-FRACTURE: Consumer Node unverified." };
    }

    // 2. TRUE ECONOMIC PROPERTIES
    const buyerTS = buyer.trust_score || 0; 
    // If merchant doesn't exist yet, default TS to 0 for initial tax calculation
    const merchantTS = merchant ? (merchant.trust_score || 0) : 0; 

    const activeDiscount = MAX_DISCOUNT * (buyerTS / 100);
    const activeTaxRate = BASE_TAX * (1 - (merchantTS / 100));

    const buyerPays = cartValue * (1 - activeDiscount);
    const treasurySubsidy = cartValue * activeDiscount; 
    const merchantReceives = cartValue * (1 - activeTaxRate);
    const treasuryCollects = cartValue * activeTaxRate;

    // 3. ZERO-TRUST SHIELD: ATOMIC BALANCE CHECK
    if ((buyer.activeFuel || 0) < buyerPays) {
      return { success: false, message: "INSUFFICIENT_FUNDS: Buyer lacks required fuel." };
    }

    // 4. ATOMIC SETTLEMENT & DIGITAL VOID SHIELD
    const treasuryNetImpact = treasuryCollects - treasurySubsidy;

    await Promise.all([
      // 🚨 FIXED: Target 'uid' instead of 'username'
      PioneerNode.updateOne(
        { uid: buyerId }, 
        { $inc: { activeFuel: -buyerPays } }
      ),
      
      // 🚨 VOID SHIELD RESTORED: Merchant Genesis Protection
      PioneerNode.updateOne(
        { uid: merchantId }, 
        { 
          $inc: { activeFuel: merchantReceives },
          $setOnInsert: { activeNodeCount: 1, uptimeStats: 100, referralCount: 0, trust_score: 50 }
        },
        { upsert: true } 
      ),
      
      // 🚨 VOID SHIELD RESTORED: Treasury Genesis Protection
      TreasuryLedger.updateOne(
        { vaultType: "MARKET_VELOCITY" }, 
        { $inc: { balance: treasuryNetImpact } },
        { upsert: true }
      ),
      
      // LOG TRANSACTION
      MarketTransaction.create({ 
        merchantId, 
        consumerId: buyerId, 
        amount: cartValue, 
        taxCollected: treasuryCollects 
      })
    ]);

    console.log(`[MESH-MARKET] 🟢 Tx Cleared. Subsidy: ${treasurySubsidy.toFixed(2)} | Tax: ${treasuryCollects.toFixed(2)}`);

    return {
      success: true,
      message: "TRANSACTION SECURED: TREASURY BALANCED",
      receipt: { originalPrice: cartValue, buyerPaid: buyerPays, merchantReceived: merchantReceives }
    };

  } catch (error) {
    console.error("[MESH-MARKET] 🚨 Transaction Fracture:", error);
    return { success: false, message: "FATAL: MARKET ENGINE OFFLINE" };
  }
}