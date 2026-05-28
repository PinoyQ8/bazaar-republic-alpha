"use server";

// 🛡️ THE MESH BRIDGE: Corrected Imports
import { connectToDatabase } from "@/lib/db";
import { PioneerNode } from "@/models/PioneerNode"; // Named export
import { TreasuryLedger } from "@/models/TreasuryLedger"; // Named export
import MarketTransaction from "@/models/MarketTransaction"; // ◄ REMOVE CURLY BRACES
import { IMarketTransaction } from "@/models/MarketTransaction"; // ◄ Optional: Import interface if needed
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
    await connectToDatabase();

    // 🛡️ CHANGE THIS SECTION INSIDE app/actions/merchantActions.ts:
const [buyer, merchant] = await Promise.all([
  PioneerNode.findOne({ uid: buyerId }).lean(),
  PioneerNode.findOne({ uid: merchantId }).lean()
]);

    if (!buyer || !merchant) {
      return { success: false, message: "MESH-FRACTURE: Node identity unverified." };
    }

   // 🛡️ REVERT TO TRUE ECONOMIC PROPERTIES
const buyerTS = buyer.trust_score || 0; 
const merchantTS = merchant.trust_score || 0;

    const activeDiscount = MAX_DISCOUNT * (buyerTS / 100);
    const activeTaxRate = BASE_TAX * (1 - (merchantTS / 100));

    const buyerPays = cartValue * (1 - activeDiscount);
    const treasurySubsidy = cartValue * activeDiscount; 
    const merchantReceives = cartValue * (1 - activeTaxRate);
    const treasuryCollects = cartValue * activeTaxRate;

    // 3. 🛑 ATOMIC BALANCE CHECK
    if ((buyer.activeFuel || 0) < buyerPays) {
      return { success: false, message: "INSUFFICIENT_FUNDS: Buyer lacks required fuel." };
    }

    // 4. 🚀 EXECUTE ATOMIC SETTLEMENT
    // The Treasury must account for the subsidy paid OUT and the tax collected IN
    const treasuryNetImpact = treasuryCollects - treasurySubsidy;

    await Promise.all([
      PioneerNode.updateOne({ username: buyerId }, { $inc: { activeFuel: -buyerPays } }),
      PioneerNode.updateOne({ username: merchantId }, { $inc: { activeFuel: merchantReceives } }),
      TreasuryLedger.updateOne(
        { vaultType: "MARKET_VELOCITY" }, 
        { $inc: { balance: treasuryNetImpact } }
      ),
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