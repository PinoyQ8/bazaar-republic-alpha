// 🛡️ NEO PROTOCOL: X570 Local Daemon
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// 🛡️ CONFIGURATION: Hard-code your vault variables
// Use http://localhost:3000/api/node-telemetry for local testing before shifting to Vercel
const EDGE_API_URL = "http://localhost:3000/api/node-telemetry"; 
const VAULT_KEY = "YOUR_PI_API_KEY_HERE"; // Must match your Vercel/Local .env
const PIONEER_ID = "PinoyQ8-Node-01"; // Your unique database identifier

async function transmitTelemetry() {
  console.log(`\n[${new Date().toISOString()}] 🛰️ MESH-SCAN: Executing Docker extraction...`);
  
  try {
    // 1. Pierce the container
    const { stdout } = await execPromise('docker exec testnet2 stellar-core http-command info');
    
    // 2. Strip the HTTP headers from the raw stdout to isolate the JSON payload
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) throw new Error("JSON fracture: Could not parse Docker output.");
    
    const cleanJson = stdout.substring(jsonStart);
    const payload = JSON.parse(cleanJson);

    // 3. Construct the MESH logic payload
    const syncData = {
      pioneerId: PIONEER_ID,
      ledger: payload.info.ledger.num,
      state: payload.info.state,
      peers: payload.info.peers.authenticated_count,
      protocolVersion: payload.info.protocol_version
    };

    // 4. Transmit to the Edge Receiver
    const response = await fetch(EDGE_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-mesh-vault-key': VAULT_KEY 
      },
      body: JSON.stringify(syncData)
    });

    if (!response.ok) {
      throw new Error(`Edge rejected payload. Status: ${response.status}`);
    }

    console.log(`[OK] 🛡️ Telemetry accepted by the MESH. Ledger: ${syncData.ledger} | Peers: ${syncData.peers}`);

  } catch (error) {
    console.error(`[FRACTURE] ⚠️ Transmission failed: ${error.message}`);
  }
}

// ⏱️ IGNITION: Run every 60 seconds to maintain the 92% Uptime Shield visibility
console.log("==========================================");
console.log("🛰️ MESH UPLINK WORKER ONLINE");
console.log("==========================================");
setInterval(transmitTelemetry, 60000);
transmitTelemetry(); // Initial burst