// Location: app/academy/remote-tunnel/page.tsx
"use client";

import React from "react";
import { ShieldCheck, Server, Terminal, Lock, Box, Activity } from "lucide-react";

export default function RemoteAccessManual() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-mono text-slate-300">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="border-b border-blue-900/50 pb-6">
          <h1 className="text-2xl font-bold text-blue-400 mb-2 flex items-center gap-3">
            <Server className="w-8 h-8" />
            Project Bazaar DAO: Remote Access & SoloHost Manual
          </h1>
          <p className="text-slate-500 text-sm">
            Protocol Version: 26.1 | Target Node: X570 Workstation (Port 31401)
          </p>
        </div>

        {/* SECTION 1: TOPOLOGY */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> 1. System Topology
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The Bazaar Custom Remote Access Bridge enables secure, off-grid RPC transport between mobile nodes and the local X570 workstation. It bypasses all third-party tunnel dependencies.
          </p>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-xs text-blue-300 overflow-x-auto">
            <pre>{`[ S23 Ultra / Pi Browser ] 
            │
            ▼ (POST /api/tunnel with x-bazaar-node-key)
 [ Vercel Edge Relay (/api/tunnel) ]
            │
            ▼ (Buffered Task Queue)
[ X570 Workstation Daemon (npm run tunnel) ]
            │
      ┌─────┴────────────────┐
      ▼                      ▼
[ SoloHost Local RPC ]   [ Pi Testnet / Horizon ]
  (Port 31401 / P26.1)    (api.testnet.minepi.com)`}</pre>
          </div>
        </section>

        {/* SECTION 2: EDGE RELAY */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Terminal className="w-5 h-5" /> 2. Cloud Edge Relay Endpoint (Vercel)
          </h2>
          <p className="text-sm text-slate-400">
            Location: <code className="text-amber-200">app/api/tunnel/route.ts</code>
          </p>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg overflow-x-auto text-xs text-slate-300">
            <pre>{`import { NextResponse } from 'next/server';

let pendingRequest: any = null;
let pendingResponse: any = null;

const NODE_SECRET_KEY = process.env.PI_API_KEY || "MESH_VAULT_KEY_ALPHA";

export async function POST(request: Request) {
  try {
    // SECURITY SHIELD: Authorize request key
    const authHeader = request.headers.get('x-bazaar-node-key');
    if (authHeader !== NODE_SECRET_KEY) {
      return NextResponse.json({ error: 'MESH REJECT: Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();

    if (body.type === 'AGENT_REGISTER') {
      return NextResponse.json({
        status: 'CONNECTED',
        hasPendingWork: !!pendingRequest,
        work: pendingRequest,
      });
    }

    if (body.type === 'AGENT_FULFILL') {
      pendingResponse = body.payload;
      pendingRequest = null;
      return NextResponse.json({ status: 'ACCEPTED' });
    }

    pendingRequest = {
      id: \`req_\${Date.now()}\`,
      targetHost: body.targetHost || 'solohost',
      endpoint: body.endpoint,
      method: body.method || 'GET',
      payload: body.payload,
      timestamp: Date.now(),
    };

    const timeout = Date.now() + 3000;
    while (Date.now() < timeout) {
      if (pendingResponse) {
        const res = pendingResponse;
        pendingResponse = null;
        return NextResponse.json(res);
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    return NextResponse.json({ error: 'TUNNEL TIMEOUT' }, { status: 504 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}`}</pre>
          </div>
        </section>

        {/* SECTION 3: LOCAL AGENT */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
            <Terminal className="w-5 h-5" /> 3. Hardened Local Agent Daemon (X570)
          </h2>
          <p className="text-sm text-slate-400">
            Location: <code className="text-blue-200">lib/tunnel-agent.ts</code>
          </p>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg overflow-x-auto text-xs text-slate-300">
            <pre>{`const CLOUD_RELAY_URL = 'https://mesh-academy-alpha.vercel.app/api/tunnel';
const LOCAL_SOLOHOST_RPC = 'http://localhost:31401';
const PI_TESTNET_RPC = 'https://api.testnet.minepi.com';
const NODE_SECRET_KEY = process.env.PI_API_KEY || "MESH_VAULT_KEY_ALPHA";

async function startTunnelAgent() {
  console.log(\`[BAZAAR TUNNEL] X570 Local Agent online.\`);
  let pollCounter = 0;

  while (true) {
    try {
      pollCounter++;
      
      const pollRes = await fetch(CLOUD_RELAY_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-bazaar-node-key': NODE_SECRET_KEY,
          'User-Agent': 'Bazaar-X570-Node-Agent/26.1',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify({ type: 'AGENT_REGISTER' }),
      });

      if (pollRes.ok) {
        const data: any = await pollRes.json();
        if (data.hasPendingWork && data.work) {
          const { work } = data;
          const targetUrl = work.targetHost === 'solohost' ? LOCAL_SOLOHOST_RPC : PI_TESTNET_RPC;
          let resultPayload = null;

          try {
            const localRpcRes = await fetch(\`\${targetUrl}\${work.endpoint || ''}\`, {
              method: work.method || 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            resultPayload = await localRpcRes.json();
          } catch (rpcErr) {
            resultPayload = { status: 'LOCAL_OFFLINE', details: String(rpcErr) };
          }

          await fetch(CLOUD_RELAY_URL, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-bazaar-node-key': NODE_SECRET_KEY
            },
            body: JSON.stringify({ type: 'AGENT_FULFILL', payload: resultPayload }),
          });
        }
      }
    } catch (err: any) {
      // Ignore socket resets, loop continues
    }
    await new Promise((r) => setTimeout(r, 750));
  }
}
startTunnelAgent();`}</pre>
          </div>
        </section>

        {/* SECTION 4: SECURITY */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <Lock className="w-5 h-5" /> 4. Security & Hardening Protocol
          </h2>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="p-4 border border-red-900/30 bg-red-950/10 rounded">
              <strong className="text-red-400 block mb-1">Threat: Unauthenticated SSRF</strong>
              <span className="text-slate-400">External callers invoking /api/tunnel to proxy arbitrary requests into localhost:31401.</span>
              <div className="mt-2 text-emerald-400">Mitigation: Strict enforcement of x-bazaar-node-key header on all relay endpoints.</div>
            </div>
            <div className="p-4 border border-red-900/30 bg-red-950/10 rounded">
              <strong className="text-red-400 block mb-1">Threat: Buffer Exhaustion</strong>
              <span className="text-slate-400">Rapid polling causing Windows TCP port exhaustion or Vercel rate-limiting.</span>
              <div className="mt-2 text-emerald-400">Mitigation: 750ms loop interval, keep-alive HTTP headers, and silent heartbeat ticks.</div>
            </div>
          </div>
        </section>

        {/* SECTION 5: SOLOHOST CONFIG */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Box className="w-5 h-5" /> 5. SoloHost Container Initialization (P26.1)
          </h2>
          <p className="text-sm text-slate-400">
            The X570 tunnel agent routes local traffic directly to the Pi Network <code>testnet2</code> Docker container. Ensure Docker Desktop is active on the workstation before initiating the sync bridge.
          </p>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="p-4 border border-slate-800 bg-slate-900 rounded">
              <strong className="text-indigo-400 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Container Launch & Validation
              </strong>
              <p className="text-slate-400 mb-3 text-xs leading-relaxed">
                The SoloHost relies on <code>config_options.yml</code> to define the environment variables required for the E-Network ledger. Upon installation via the Pi Desktop SoloHost packaging, these variables are injected into the container's <code>.env</code> file.
              </p>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-emerald-300 font-mono">
                {`# Verify container status on X570
docker ps | findstr testnet2

# Verify Port 31401 RPC health check
curl http://localhost:31401/

# Expected Output:
# {
#   "core_version": "core-20.0.0",
#   "network_passphrase": "Pi Testnet",
#   "protocol_version": 20
# }`}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}