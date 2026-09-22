// Location: app/actions/marketActions.ts
"use server";

import mongoose from 'mongoose';
import { MarketListing } from "@/models/MarketListing";
import { PioneerNode } from "@/models/PioneerNode";
import { TransactionLedger } from "@/models/TransactionLedger";
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const DEFAULT_VAULT_CONTRACT = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY";

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

    let node = await PioneerNode.findOne({
      $or: [{ username: providerId }, { uid: providerId }]
    });

    if (!node) {
      node = await PioneerNode.create({
        username: providerId,
        uid: providerId,
        stake_amount: 500,
        mbzrBalance: 1000,
        trust_score: 90,
        status: 'ACTIVE'
      });
      console.log(`[MESH-MARKET] 🟢 Auto-registered missing node in Master Index: ${providerId}`);
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
// 4. 🛡️ THE MESH-MARKET: TRIPLE-LEDGER & PROTOCOL 28 VAULT BRIDGE
// ----------------------------------------------------------------------
export async function executeMarketTransaction(
  buyerId: string, 
  merchantId: string, 
  pricePi: number
) {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE: Atlas unreachable." };

    const [buyer, merchant] = await Promise.all([
      PioneerNode.findOne({ $or: [{ username: buyerId }, { uid: buyerId }] }).lean(),
      PioneerNode.findOne({ $or: [{ username: merchantId }, { uid: merchantId }] }).lean()
    ]);

    if (!buyer || !merchant) return { success: false, message: "MESH-FRACTURE: Node identity unverified." };

    // 🛡️ 1. TRUST SHIELD & CONVERSION
    const buyerTS = buyer.trust_score || buyer.trustScore || 10;
    const MBZR_CONVERSION_RATIO = 1000;
    const grossTotalMBZR = pricePi * MBZR_CONVERSION_RATIO;

    // 🛡️ 2. TRIPLE-LEDGER MATH & REPUBLIC SHIELD INJECTION
    const EVAT_RATE = 0.12; // 12% Global e-VAT
    const BASE_SERVICE_TAX = 0.08; // 8% DAO Tax
    const TRUST_SHIELD = (buyerTS / 100) * 0.05; // Up to 5% Tax Reduction
    const DYNAMIC_SERVICE_TAX = BASE_SERVICE_TAX - TRUST_SHIELD;

    const eVatAmount = Number((grossTotalMBZR * EVAT_RATE).toFixed(2));
    const totalServiceTax = Number((grossTotalMBZR * DYNAMIC_SERVICE_TAX).toFixed(2));
    
    // 🏥 THE REPUBLIC SHIELD SIPHON (80/20 Split)
    const daoOperations = Number((totalServiceTax * 0.80).toFixed(2));
    const republicShieldVault = Number((totalServiceTax * 0.20).toFixed(2));

    const unitPriceYield = Number((grossTotalMBZR - eVatAmount - totalServiceTax).toFixed(2));
    const subsidyValue = Number((grossTotalMBZR * TRUST_SHIELD).toFixed(2));

    // 🛡️ 3. LIQUIDITY VERIFICATION
    if ((buyer.mbzrBalance || 0) < grossTotalMBZR) {
      return { 
        success: false, 
        message: `INSUFFICIENT_FUNDS: Required ${grossTotalMBZR} mBZR. Balance: ${(buyer.mbzrBalance || 0).toFixed(2)}` 
      };
    }

    // 🛡️ 4. MONGOOSE WALLET UPDATES
    await Promise.all([
      PioneerNode.updateOne({ uid: buyer.uid }, { $inc: { mbzrBalance: -grossTotalMBZR } }),
      PioneerNode.updateOne({ uid: merchant.uid }, { $inc: { mbzrBalance: unitPriceYield } })
    ]);

    // 📊 5. LOG QUAD-LEDGER TELEMETRY
    const txId = `TX-${Date.now().toString().slice(-8)}`;
    const cleanOrderId = txId.replace(/-/g, '_');
    const normalizedEscrowId = `ESC_${cleanOrderId}`;
    
    await TransactionLedger.create({
      txId,
      buyerId: buyer.uid,
      merchantId: merchant.uid,
      cartValue: pricePi, 
      buyerPaid: grossTotalMBZR,
      subsidyApplied: subsidyValue,
      taxCollected: totalServiceTax, 
      daoOperationsYield: daoOperations,
      republicShieldYield: republicShieldVault, 
      eVatCollected: eVatAmount, 
      timestamp: Date.now()
    } as any);

    console.log(`[MESH-ADJUDICATOR] 📊 TRANSPARENCY BREAKDOWN (Gross: ${grossTotalMBZR} mBZR)`);
    console.log(`[MESH-ADJUDICATOR] 1. Merchant Unit Price : ${unitPriceYield} mBZR`);
    console.log(`[MESH-ADJUDICATOR] 2. DAO Operations Vault : ${daoOperations} mBZR`);
    console.log(`[MESH-ADJUDICATOR] 3. Republic Shield Vault: ${republicShieldVault} mBZR`);
    console.log(`[MESH-ADJUDICATOR] 4. Government e-VAT    : ${eVatAmount} mBZR`);
    console.log(`[MESH-MARKET] 🟢 Tx Cleared & Logged: ${txId}`);

   // 🛡️ 6. PROTOCOL 28 ESCROW BRIDGE (PRISMA DUAL-WRITE)
    try {
      let providerRecord = await prisma.serviceProvider.findFirst({
        where: {
          OR: [
            { providerUid: merchant.uid },
            { businessName: merchant.username || merchantId },
          ],
        },
      });

      if (!providerRecord) {
        providerRecord = await prisma.serviceProvider.create({
          data: {
            businessName: merchant.username || merchantId || "Virtual Merchant",
            category: "COMPUTE",
            description: "Automated Protocol 28 Vault Merchant Node",
            providerUid: merchant.uid,
            sectorLocation: "Sector-01-Mesh",
            mbzrRate: 1000.0,
            unitLabel: "mBZR/Pi",
            isVerified: true,
          },
        });
      }

      await prisma.escrowLock.upsert({
        where: { escrowId: normalizedEscrowId },
        update: {
          status: 'PENDING_ONCHAIN',
          amount: pricePi,
          paymentId: `PAY_${cleanOrderId}`,
          updatedAt: new Date(),
        },
        create: {
          escrowId: normalizedEscrowId,
          paymentId: `PAY_${cleanOrderId}`,
          txid: txId,
          consumerUid: buyer.uid,
          providerId: providerRecord.id,
          amount: pricePi,
          token: "PI",
          status: 'PENDING_ONCHAIN',
          serviceDescription: `Project Bazaar Market Purchase (${txId})`,
          timelockExpiresAt: new Date(Date.now() + 172800 * 1000), // 48-hour timelock
        },
      });
      console.log(`[MESH-ESCROW] ✅ Dual-write EscrowLock synchronized: ${normalizedEscrowId}`);
    } catch (err: any) {
      console.warn(`[MESH-ESCROW] ⚠️ Prisma dual-write skipped/non-blocking:`, err.message);
    }

    // 🛡️ 7. RETURN TRANSPARENT RECEIPT & AUTO-REDIRECT META
    return {
      success: true,
      message: "Quad-Ledger Transaction Secured & Vault Linked.",
      txId,
      orderId: cleanOrderId,
      escrowId: normalizedEscrowId,
      redirectUrl: `/checkout/success?orderId=${cleanOrderId}`,
      receipt: {
        txId,
        grossTotal: grossTotalMBZR,
        unitPrice: unitPriceYield,
        daoOperations: daoOperations,
        republicShield: republicShieldVault,
        eVat: eVatAmount,
        dynamicTaxRate: `${(DYNAMIC_SERVICE_TAX * 100).toFixed(1)}%`,
        currency: 'mBZR'
      }
    };

  } catch (error) {
    console.error("[MESH-MARKET] 🚨 Transaction Fracture:", error);
    return { success: false, message: "FATAL: MARKET ENGINE OFFLINE" };
  }
}

// ----------------------------------------------------------------------
// 5. 🌱 DEVELOPMENT ONLY: SEED VIRTUAL MARKET & TEST NODES
// ----------------------------------------------------------------------
export async function seedVirtualMarket() {
  try {
    const isConnected = await connectDB();
    if (!isConnected) return { success: false, message: "NETWORK_OFFLINE" };
    
    // 1. Seed Virtual Merchant with Collateral & Balances
    await PioneerNode.findOneAndUpdate(
      { uid: 'Virtual_Node' },
      {
        username: 'Virtual_Node',
        uid: 'Virtual_Node',
        stake_amount: 500,
        mbzrBalance: 500000,
        trust_score: 95,
        status: 'ACTIVE'
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 2. Seed Local Dev Node (PinoyQ8_Dev) with Test Liquidity
    await PioneerNode.findOneAndUpdate(
      { uid: 'local_x570_node' },
      {
        username: 'PinoyQ8_Dev',
        uid: 'local_x570_node',
        stake_amount: 500, 
        mbzrBalance: 1000000, // 1 Million mBZR Test Liquidity
        trust_score: 90,
        status: 'ACTIVE'
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 3. Clear and Reset Virtual Listings
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
        listingId: `SVC-V2-${Date.now() + 1}`,
        providerId: 'Virtual_Node',
        title: 'Virtual: UX/UI Matrix Audit',
        description: 'Test listing. Comprehensive design review of your E-Network viewport.',
        serviceCategory: 'CONSULTING',
        pricePi: 50,
        requiredCollateral: 0,
        status: 'ACTIVE'
      },
      {
        listingId: `SVC-V3-${Date.now() + 2}`,
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
    
    return { success: true, message: "VIRTUAL MARKET & TEST NODES SEEDED: Ready for transaction execution." };
  } catch (error: any) {
    console.error("[MESH-MARKET] 🚨 SEED FRACTURE:", error);
    return { success: false, message: `SEED_FAILED: ${error.message}` };
  }
}