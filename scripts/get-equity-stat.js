// Replace your get-equity-stat.js with this one-time audit
const db = require('./lib/db');
const { PioneerNode } = require('./models/PioneerNode');

async function auditData() {
  await db.connectToDatabase();
  const allNodes = await PioneerNode.find({}).limit(5); // View the first 5 records
  console.log("AUDIT: Sample node data:", JSON.stringify(allNodes, null, 2));
  process.exit();
}
auditData();