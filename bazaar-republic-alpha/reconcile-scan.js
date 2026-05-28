// reconcile-scan.js
const db = require('./lib/db');
const { PioneerNode } = require('./models/PioneerNode');

async function reconcile() {
  await db.connectToDatabase();
  const nodes = await PioneerNode.find({});
  console.log("RECONCILIATION: Node State Dump:", JSON.stringify(nodes, null, 2));
  process.exit();
}
reconcile();