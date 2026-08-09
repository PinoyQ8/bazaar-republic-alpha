// Location: app/actions/marketActions.ts
"use server";

import mongoose from 'mongoose';
import { MarketListing } from "@/models/MarketListing";
import { PioneerNode } from "@/models/PioneerNode";
import { TransactionLedger } from "@/models/TransactionLedger"; // 🛡️ Injected Ledger
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

    const node = await PioneerNode.findOne({
      $or: [{ username: providerId }, { uid: providerId }]
    });

    if (!node) {
      return { success: false, message: "ADJUDICATOR HALT: Provider Node not found in Master Index." };
    }

    const currentStake = node.stake_amount || 0;
    
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
      message: "SERVICE LISTED: Vault Collateral verified.",
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
    if (!listing) return { success: false, message: "UNAUTHORIZED: Listing not found." };

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
  cartValue: number
) {
  const MAX_DISCOUNT = 0.10; 
  const BASE_TAX = 0.03;     

  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE: Atlas unreachable." };

    const [buyer, merchant] = await Promise.all([
      PioneerNode.findOne({ $or: [{ username: buyerId }, { uid: buyerId }] }).lean(),
      PioneerNode.findOne({ $or: [{ username: merchantId }, { uid: merchantId }] }).lean()
    ]);

    if (!buyer || !merchant) return { success: false, message: "MESH-FRACTURE: Node identity unverified." };

    const buyerTS = buyer.trust_score || buyer.trustScore || 10;
    const merchantTS = merchant.trust_score || merchant.trustScore || 10;

    const activeDiscount = MAX_DISCOUNT * (buyerTS / 100);
    const activeTaxRate = BASE_TAX * (1 - (merchantTS / 100));

    const buyerPays = cartValue * (1 - activeDiscount);
    const treasurySubsidy = cartValue * activeDiscount; 
    const merchantReceives = cartValue * (1 - activeTaxRate);
    const treasuryCollects = cartValue * activeTaxRate;

    if ((buyer.mbzrBalance || 0) < buyerPays) {
      return { 
        success: false, 
        message: `INSUFFICIENT_FUNDS: Buyer lacks required mBZR. Balance: ${(buyer.mbzrBalance || 0).toFixed(2)}` 
      };
    }

    await Promise.all([
      PioneerNode.updateOne({ uid: buyer.uid }, { $inc: { mbzrBalance: -buyerPays } }),
      PioneerNode.updateOne({ uid: merchant.uid }, { $inc: { mbzrBalance: merchantReceives } })
    ]);

    // 📊 6. LOG BEHAVIORAL DATA TO TRANSACTION LEDGER
    const txId = `TX-${Date.now().toString().slice(-8)}`;
    await TransactionLedger.create({
      txId,
      buyerId: buyer.uid,
      merchantId: merchant.uid,
      cartValue,
    buyerPaid: buyerPays, // 🛡️ ADJUDICATOR FIX: Mapped correctly
    subsidyApplied: treasurySubsidy,
      taxCollected: treasuryCollects,
      timestamp: Date.now()
    });

    console.log(`[MESH-MARKET] 🟢 Tx Cleared & Logged: ${txId}`);

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

// ----------------------------------------------------------------------
// 5. 🌱 DEVELOPMENT ONLY: SEED VIRTUAL MARKET
// ----------------------------------------------------------------------
export async function seedVirtualMarket() {
  try {
    await connectDB();
    
    await MarketListing.deleteMany({ providerId: 'Virtual_Node' });

    const virtualListings = [
      {
        listingId: `SVC-V1-${Date.now()}`,
        providerId: 'Virtual_Node',
        title: 'Virtual: Docker Container (1GB RAM)',
        description: 'Test listing. Automated cloud compute node for executing light logic scripts.',
        serviceCategory: 'COMPUTE',
        pricePi: 15,
        requiredCollateral: 0,
        status: 'ACTIVE'
      },
      {
        listingId: `SVC-V2-${Date.now()}`,
        providerId: 'Virtual_Node',
        title: 'Virtual: UX/UI Matrix Audit',
        description: 'Test listing. Comprehensive design review of your E-Network viewport.',
        serviceCategory: 'CONSULTING',
        pricePi: 50,
        requiredCollateral: 0,
        status: 'ACTIVE'
      },
      {
        listingId: `SVC-V3-${Date.now()}`,
        providerId: 'Virtual_Node',
        title: 'Virtual: Neo Protocol Scripting API',
        description: 'Test listing. Access to automated Adjudicator endpoints.',
        serviceCategory: 'DIGITAL_ASSET',
        pricePi: 100,
        requiredCollateral: 0,
        status: 'ACTIVE'
      }
    ];

    await MarketListing.insertMany(virtualListings);
    revalidatePath('/dashboard/marketplace');
    
    return { success: true, message: "VIRTUAL MARKET SEEDED: 3 Test Services Online." };
  } catch (error: any) {
    return { success: false, message: `SEED_FAILED: ${error.message}` };
  }
}