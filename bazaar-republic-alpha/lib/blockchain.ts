// lib/blockchain.ts

const ISSUER_KEY = "GCD4GW27B2PQZGJGLCAQYEAEKDDDGWY7U6CHNSFY6AOEUBLEU3FGWG4D";
const TREASURY_KEY = "GAI5DGRUHXCMLDTHMVCZBHGTQXTP2SOS3CMX3KWGAF7XGXTNN5TLMTTA";
const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";

export async function checkBlockchainStatus() {
  // Define a timeout to prevent infinite hanging (5 seconds)
  const timeout = (ms: number) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Request timed out")), ms)
  );

  try {
    const fetchWithTimeout = async (url: string) => {
      const response = await Promise.race([
        fetch(url, { headers: { "Accept": "application/json" } }),
        timeout(5000)
      ]) as Response;

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return response.json();
    };

    // Parallel Execution (Non-blocking)
    const [treasuryData, issuerData] = await Promise.all([
      fetchWithTimeout(`${HORIZON_TESTNET}/accounts/${TREASURY_KEY}`),
      fetchWithTimeout(`${HORIZON_TESTNET}/accounts/${ISSUER_KEY}/transactions?limit=1&order=desc`)
    ]);

    return {
      status: "SECURE",
      treasuryBalance: treasuryData.balances,
      lastIssuerTx: issuerData._embedded.records[0] || "No recent activity"
    };

  } catch (error: any) {
    console.error("BLOCKCHAIN_AUDIT_FRACTURE:", error.message);
    return { status: "FRACTURE", message: error.message };
  }
}