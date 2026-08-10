// PROJECT BAZAAR DAO - PROTOCOL 26.1
// DAEMON: LOCAL X570 TUNNEL AGENT

const CLOUD_RELAY_URL = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/tunnel` 
  : 'http://localhost:3000/api/tunnel';

const LOCAL_SOLOHOST_RPC = 'http://localhost:31401';
const PI_TESTNET_RPC = 'https://api.testnet.minepi.com';

async function startTunnelAgent() {
  console.log('[BAZAAR TUNNEL] X570 Local Agent online. Polling cloud bridge...');

  while (true) {
    try {
      // 1. Poll cloud relay for pending RPC tasks from S23 Ultra
      const pollRes = await fetch(CLOUD_RELAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'AGENT_REGISTER' }),
      });

      if (pollRes.ok) {
        const data: any = await pollRes.json();

        if (data.hasPendingWork && data.work) {
          const { work } = data;
          console.log(`[TUNNEL ROUTE] Forwarding request to target: ${work.targetHost}`);

          // 2. Select target RPC endpoint based on MasterMeshSwitch selection
          const targetUrl = work.targetHost === 'solohost' 
            ? LOCAL_SOLOHOST_RPC 
            : PI_TESTNET_RPC;

          let resultPayload = null;

          try {
            const localRpcRes = await fetch(`${targetUrl}${work.endpoint || ''}`, {
              method: work.method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(work.payload),
            });

            resultPayload = await localRpcRes.json();
          } catch (rpcErr) {
            resultPayload = { error: 'LOCAL RPC EXECUTION FAULT', details: String(rpcErr) };
          }

          // 3. Fulfill task back to Cloud Relay
          await fetch(CLOUD_RELAY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'AGENT_FULFILL',
              payload: resultPayload,
            }),
          });
        }
      }
    } catch (err) {
      console.warn('[TUNNEL RETRY] Polling cycle missed:', String(err));
    }

    // Polling interval: 500ms for low-latency RPC execution
    await new Promise((r) => setTimeout(r, 500));
  }
}

startTunnelAgent();