const db = require('./lib/db');
const { PioneerNode } = require('./models/PioneerNode');

async function restoreTreasury() {
  try {
    await db.connectToDatabase();
    
    console.log("SYNC: Initializing Treasury Genesis...");

    // Using 'upsert: true' forces MongoDB to create the node if it doesn't exist
    await PioneerNode.updateOne(
      { uid: "SYSTEM_DAO_COLLECTOR" },
      { 
        $set: { 
          activeNodeCount: 1, 
          uptimeStats: 100, 
          referralCount: 0, 
          trust_score: 100 
        },
        // Restoring the 1,000 burned mBZR
        $inc: { activeFuel: 1000 } 
      },
      { upsert: true }
    );

    console.log("SYNC: SYSTEM_DAO_COLLECTOR Node created.");
    console.log("SYNC: 1,000 mBZR Restored to Treasury.");
  } catch (e) {
    console.error("GENESIS_FRACTURE:", e);
  }
  process.exit();
}

restoreTreasury();