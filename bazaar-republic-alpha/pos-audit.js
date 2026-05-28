// pos-audit.js (Unified Settlement & Treasury Audit)
const db = require('./lib/db');
const { PioneerNode } = require('./models/PioneerNode');

async function executeAndAudit(cartValue, buyerUid = "PinoyQ8", merchantUid = "SYSTEM_DAO_COLLECTOR") {
  try {
    await db.connectToDatabase();
    console.log(`\nSYNC: Phase 1 - Initiating Settlement | Value: ${cartValue} mBZR`);

    // DEDUCT FROM BUYER
    await PioneerNode.updateOne(
      { uid: buyerUid },
      { $inc: { activeFuel: -cartValue } }
    );

    // BULLETPROOF CREDIT (Upsert logic to prevent the void)
    await PioneerNode.updateOne(
      { uid: merchantUid },
      { 
        $inc: { activeFuel: cartValue },
        $setOnInsert: { activeNodeCount: 1, uptimeStats: 100, referralCount: 0, trust_score: 50 }
      },
      { upsert: true }
    );
    console.log(`SYNC: Settlement Cleared.\n`);

    // INSTANT POST-SETTLEMENT AUDIT
    console.log(`SYNC: Phase 2 - Running Live Treasury Audit...`);
    const accounts = await PioneerNode.find({ uid: { $in: [buyerUid, merchantUid] } });
    
    console.log("------------------------------------------");
    console.log("AUDIT: Current Active Fuel:");
    accounts.forEach(node => {
      console.log(` - [${node.uid}]: ${node.activeFuel} mBZR`);
    });
    console.log("------------------------------------------");

  } catch (e) {
    console.error("MESH_FRACTURE:", e);
  }
  process.exit();
}

// Execute the test with 500 mBZR
executeAndAudit(500);