// PROJECT BAZAAR DAO - PROTOCOL 26.1
// DAEMON: LOCAL X570 TUNNEL AGENT

const CLOUD_RELAY_URL = 'https://mesh-academy-alpha.vercel.app/api/tunnel';
const LOCAL_SOLOHOST_RPC = 'http://localhost:31401';
const PI_TESTNET_RPC = 'https://api.testnet.minepi.com';

async function startTunnelAgent() {
  console.log(`[BAZAAR TUNNEL] X570 Local Agent online. Polling cloud bridge at: ${CLOUD_RELAY_URL}`);

  while (true) {
    try {
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

          const targetUrl = work.targetHost === 'solohost' 
            ? LOCAL_SOLOHOST_RPC 
            : PI_TESTNET_RPC;

          let resultPayload = null;

          try {
            const localRpcRes = await fetch(`${targetUrl}${work.endpoint || ''}`, {
              method: work.method || 'GET',
              headers: { 'Content-Type': 'application/json' },
            });

            resultPayload = await localRpcRes.json();
          } catch (rpcErr) {
            resultPayload = { 
              status: 'LOCAL_SOLOHOST_OFFLINE', 
              message: 'Local RPC at 31401 did not respond, but Tunnel Bridge is active.',
              details: String(rpcErr) 
            };
          }

          // Return response to Vercel
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

    // Fast 300ms polling cycle
    await new Promise((r) => setTimeout(r, 300));
  }
}

startTunnelAgent();