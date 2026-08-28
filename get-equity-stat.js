const db = require('./lib/db');
const { PioneerNode } = require('./models/PioneerNode');

async function checkEquity() {
  try {
    await db.connectToDatabase();
    
    // Aggregation updated to target 'activeFuel'
    const stats = await PioneerNode.aggregate([
      { $group: { _id: null, total: { $sum: "$activeFuel" } } }
    ]);
    
    console.log("------------------------------------------");
    console.log("TOTAL NETWORK EQUITY (ACTIVE FUEL):", stats[0]?.total || 0);
    console.log("------------------------------------------");
  } catch (e) {
    console.error("EQUITY_SCAN_ERROR:", e);
  }
  process.exit();
}

checkEquity();