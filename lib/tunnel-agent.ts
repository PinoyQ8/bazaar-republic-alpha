// PROJECT BAZAAR DAO - PROTOCOL 26.1
// DAEMON: LOCAL X570 TUNNEL AGENT (HARDENED + AUTH SHIELD)

const CLOUD_RELAY_URL = process.env.CLOUD_RELAY_URL || 'https://mesh-academy-alpha.vercel.app/api/tunnel';
const LOCAL_SOLOHOST_RPC = process.env.LOCAL_SOLOHOST_RPC || 'http://localhost:31401';
const PI_TESTNET_RPC = process.env.PI_TESTNET_RPC || 'https://api.testnet.minepi.com';

// 🛡️ VAULT KEY AUTHENTICATION
const NODE_SECRET_KEY = process.env.PI_API_KEY || "MESH_VAULT_KEY_ALPHA";

interface TunnelWork {
  id?: string;
  targetHost: 'solohost' | 'testnet' | string;
  path?: string;
  method?: string;
  payload?: Record<string, any>;
  headers?: Record<string, string>;
}

async function startTunnelAgent() {
  console.log(`[BAZAAR TUNNEL] X570 Local Agent online. Polling cloud bridge at: ${CLOUD_RELAY_URL}`);
  
  let pollCounter = 0;

  while (true) {
    try {
      pollCounter++;
      
      if (pollCounter % 5 === 0) {
        process.stdout.write(`\r[TUNNEL PULSE] Listening to Vercel Edge... Ticks: ${pollCounter}`);
      }

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
          const work: TunnelWork = data.work;
          console.log(`\n[TUNNEL ROUTE] Forwarding request to target: ${work.targetHost}`);

          const baseUrl = work.targetHost === 'solohost' 
            ? LOCAL_SOLOHOST_RPC 
            : PI_TESTNET_RPC;

          const endpoint = work.path ? `${baseUrl}${work.path.startsWith('/') ? '' : '/'}${work.path}` : baseUrl;
          let resultPayload: Record<string, any> | null = null;

          try {
            // 🛡️ Dispatch inbound work to the local RPC / SoloHost node
            const rpcRes = await fetch(endpoint, {
              method: work.method || 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(work.headers || {})
              },
              body: work.payload ? JSON.stringify(work.payload) : undefined,
              signal: AbortSignal.timeout(5000),
            });

            if (!rpcRes.ok) {
              throw new Error(`Target RPC responded with HTTP ${rpcRes.status}: ${rpcRes.statusText}`);
            }

            resultPayload = await rpcRes.json();
          } catch (rpcErr: any) {
            console.warn('[TUNNEL AGENT WARN] RPC execution failed:', rpcErr.message);
            resultPayload = {
              status: 'error',
              message: 'Target node did not respond, but Tunnel Agent is active.',
              details: String(rpcErr.message || rpcErr),
            };
          }

          // 🛡️ Return authenticated fulfillment payload back to Vercel Edge Relay
          await fetch(CLOUD_RELAY_URL, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-bazaar-node-key': NODE_SECRET_KEY,
              'User-Agent': 'Bazaar-X570-Node-Agent/26.1'
            },
            body: JSON.stringify({
              type: 'AGENT_FULFILL',
              workId: work.id,
              payload: resultPayload,
            }),
          });
        }
      } else if (pollRes.status === 401) {
        process.stdout.write(`\n[SECURITY REJECT] Edge relay rejected agent key (401 Unauthorized).`);
      }
    } catch (err: any) {
      const errMsg = err?.cause?.message || err?.message || String(err);
      process.stdout.write(`\n[TUNNEL RETRY] Socket reset (${errMsg}). Auto-reconnecting...`);
    }

    await new Promise((r) => setTimeout(r, 750));
  }
}

startTunnelAgent();