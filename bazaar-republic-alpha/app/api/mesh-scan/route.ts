// app/api/mesh-scan/route.ts
import { Horizon } from '@stellar/stellar-sdk';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[MESH-SCAN] Initiating Horizon handshake...');

    const horizonUrl = 'https://api.testnet.minepi.com';
    const server = new Horizon.Server(horizonUrl);

    // Fetch root telemetry to verify protocol alignment
    const root = await server.root();
    
    // TYPE OVERRIDE: Prioritize standard v15 properties, fallback to Pi's custom keys via 'any' cast
    const protocolVersion = root.core_supported_protocol_version 
      || root.current_protocol_version 
      || (root as any).protocol_version;
      
    const coreVersion = root.core_version;
    const latestLedger = root.history_latest_ledger;

    console.log(`[MESH-SCAN] Protocol Verified: v${protocolVersion} | Ledger: ${latestLedger}`);

    // Return the decentralized data to the Command Center
    return NextResponse.json({
      status: 'MESH_ACTIVE',
      message: 'Connection to Pi Network Horizon established.',
      target_node: horizonUrl,
      telemetry: {
        network_passphrase: root.network_passphrase,
        protocol_version: protocolVersion,
        core_version: coreVersion,
        horizon_version: root.horizon_version,
        latest_ledger: latestLedger,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-FAULT] Horizon connection failed:', error);
    
    return NextResponse.json({
      status: 'MESH_FAULT',
      message: 'Failed to establish connection with the Horizon node. Check network bindings.',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}