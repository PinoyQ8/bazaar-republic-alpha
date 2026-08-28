// Location: mesh-uplink.mjs
// 🛡️ NEO PROTOCOL: X570 Local Daemon (Hardened)
import { exec } from 'child_process';
import util from 'util';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const execPromise = util.promisify(exec);

// Configuration with environment variable fallbacks
// Inside mesh-uplink.mjs
const EDGE_API_URL = process.env.MESH_TELEMETRY_URL || 'http://127.0.0.1:3000/api/node-telemetry';
const VAULT_KEY = process.env.PI_API_KEY || process.env.MESH_HARDWARE_KEY || 'i14fsoibbyytl3ilaol7hdzxpsz2vtmjmx6plf5xg9nezgnsqzlf6odlrjvven8g';
const PIONEER_ID = process.env.MESH_PIONEER_ID || 'PinoyQ8-Node-01';
const DOCKER_CONTAINER = process.env.MESH_DOCKER_CONTAINER || 'testnet2';

async function transmitTelemetry() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🛰️ MESH-SCAN: Executing Docker extraction...`);

  try {
    // 1. Query the stellar-core container with a 10s execution timeout
    const { stdout } = await execPromise(`docker exec ${DOCKER_CONTAINER} stellar-core http-command info`, {
      timeout: 10000,
    });

    // 2. Extract JSON from raw HTTP response
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      throw new Error('JSON fracture: Could not isolate JSON from Docker output.');
    }

    const payload = JSON.parse(stdout.substring(jsonStart));

    // 3. Formulate standardized telemetry payload
    const syncData = {
      pioneerId: PIONEER_ID,
      uid: PIONEER_ID,
      ledger: payload.info?.ledger?.num || 0,
      state: payload.info?.state || 'UNKNOWN',
      peers: payload.info?.peers?.authenticated_count || 0,
      protocolVersion: String(payload.info?.protocol_version || '28'),
    };

    // 4. Transmit authenticated payload to receiver
    const response = await fetch(EDGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mesh-hardware-key': VAULT_KEY,
      },
      body: JSON.stringify(syncData),
      signal: AbortSignal.timeout(8000), // 8-second circuit breaker
    });

    if (!response.ok) {
      throw new Error(`Edge rejected payload. Status: ${response.status}`);
    }

    console.log(`[OK] 🛡️ Telemetry accepted by MESH. Ledger: ${syncData.ledger} | Peers: ${syncData.peers} | Protocol: v${syncData.protocolVersion}`);
  } catch (error) {
    console.error(`[FRACTURE] ⚠️ Transmission failed: ${error.message}`);
  }
}

// Ignition
console.log('==========================================');
console.log(`🛰️ MESH UPLINK WORKER ONLINE [Node: ${PIONEER_ID}]`);
console.log(`Target: ${EDGE_API_URL}`);
console.log('==========================================');

setInterval(transmitTelemetry, 60000);
transmitTelemetry();