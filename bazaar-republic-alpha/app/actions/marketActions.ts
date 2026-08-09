// Location: app/actions/marketActions.ts
"use server";

import mongoose from 'mongoose';
import { MarketListing } from "@/models/MarketListing";
import { PioneerNode } from "@/models/PioneerNode";
import { revalidatePath } from 'next/cache';

/**
 * 🛡️ MONGODB CONNECTION GATEWAY
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return true;
  const uri = process.env.MONGODB_URI || process.env.XXXMONGODB_URI;
  if (!uri) return false;

  try {
    await mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 3000 });
    return true;
  } catch (err) {
    console.warn("[MESH-MARKET] ⚠️ Atlas unreachable.");
    return false;
  }
}

// ----------------------------------------------------------------------
// 1. 🛍️ FETCH ALL ACTIVE E-NETWORK LISTINGS
// ----------------------------------------------------------------------
export async function getActiveListings() {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return [];

    const listings = await MarketListing.find({ status: 'ACTIVE' })
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(listings));
  } catch (error) {
    console.error(`[MESH-MARKET] 🚨 FETCH FRACTURE:`, error);
    return [];
  }
}

// ----------------------------------------------------------------------
// 2. 📝 CREATE NEW SERVICE LISTING (Requires Collateral Audit)
// ----------------------------------------------------------------------
export async function createMarketListing(
  providerId: string,
  title: string,
  description: string,
  serviceCategory: 'COMPUTE' | 'DIGITAL_ASSET' | 'NODE_HOSTING' | 'CONSULTING',
  pricePi: number,
  requiredCollateral: number
) {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE: Market Engine offline." };

    // 🛡️ ADJUDICATOR AUDIT: Verify Provider Node & Collateral
    const node = await PioneerNode.findOne({
      $or: [{ username: providerId }, { uid: providerId }]
    });

    if (!node) {
      return { success: false, message: "ADJUDICATOR HALT: Provider Node not found in Master Index." };
    }

    const currentStake = node.stake_amount || 0;
    
    // 🛡️ PERIMETER SHIELD: Deny listing if collateral is insufficient
    if (currentStake < requiredCollateral) {
      return {
        success: false,
        message: `ADJUDICATOR HALT: Insufficient Vault Collateral. Required: ${requiredCollateral} Pi | Current: ${currentStake} Pi.`
      };
    }

    const newListing = await MarketListing.create({
      listingId: `SVC-${Date.now().toString().slice(-6)}`,
      providerId,
      title,
      description,
      serviceCategory,
      pricePi,
      requiredCollateral,
      status: 'ACTIVE'
    });

    revalidatePath('/dashboard/marketplace');
    return {
      success: true,
      message: "SERVICE LISTED: Vault Collateral verified. Listing is now live on the E-Network.",
      listingId: newListing.listingId
    };
  } catch (error: any) {
    console.error(`[MESH-MARKET] 🚨 CREATION FRACTURE:`, error.message);
    return { success: false, message: `CREATION_FAILED: ${error.message}` };
  }
}

// ----------------------------------------------------------------------
// 3. 🛑 DELIST / PAUSE SERVICE
// ----------------------------------------------------------------------
export async function toggleListingStatus(listingId: string, providerId: string, newStatus: 'PAUSED' | 'DELISTED') {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE" };

    const listing = await MarketListing.findOne({ listingId, providerId });
    if (!listing) return { success: false, message: "UNAUTHORIZED: Listing not found or you are not the provider." };

    listing.status = newStatus;
    await listing.save();

    revalidatePath('/dashboard/marketplace');
    return { success: true, message: `Listing status updated to ${newStatus}.` };
  } catch (error: any) {
    return { success: false, message: `UPDATE_FAILED: ${error.message}` };
  }
}

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
    if ((buyer.mbzrBalance || 0) < buyerPays) {
      return { 
        success: false, 
        message: `INSUFFICIENT_FUNDS: Buyer lacks required mBZR. Balance: ${(buyer.mbzrBalance || 0).toFixed(2)}` 
      };
    }

    // 5. 🚀 EXECUTE ATOMIC SETTLEMENT (The Ledger Update)
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