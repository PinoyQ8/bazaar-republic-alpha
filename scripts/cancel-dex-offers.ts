import {
  Asset,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

/**
 * 🪙 BAZAAR REPUBLIC: DEX Liquidity & Offer Clean-up Utility (v1.0.0)
 * ----------------------------------------------------------------------------
 * This script automates the removal of all active limit orders (liquidity)
 * posted by your Pioneer account on the Stellar/Pi Testnet DEX.
 *
 * How it works:
 * 1. Queries the Horizon API for all active offers under your G-Address.
 * 2. Compiles a batch transaction where each offer's amount is set to "0".
 * 3. Deletes the offers on-chain, freeing up your account's base reserve.
 * ----------------------------------------------------------------------------
 * Motto: "In code we trust"
 * © BAZAAR REPUBLIC
 */

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Configure your credential secret (set in .env.local or shell)
const PIONEER_SECRET = process.env.PIONEER_SIGNER_SECRET || "YOUR_SECRET_KEY";

async function clearDexLiquidity() {
  console.log("🧹 [DEX-CLEANUP] Initializing Liquidity Removal Protocol...");

  if (PIONEER_SECRET === "YOUR_SECRET_KEY") {
    console.error("❌ [DEX-CLEANUP] Missing PIONEER_SIGNER_SECRET in environment.");
    process.exit(1);
  }

  const keypair = Keypair.fromSecret(PIONEER_SECRET);
  const publicKey = keypair.publicKey();
  console.log(`👤 [DEX-CLEANUP] Target Wallet Address: ${publicKey}`);

  const horizon = new Horizon.Server(HORIZON_URL);

  // 1. Load current account state to get sequence number
  let account;
  try {
    account = await horizon.loadAccount(publicKey);
    console.log(`✓ Account loaded successfully (Sequence: ${account.sequenceNumber()})`);
  } catch (err: any) {
    console.error(`❌ [DEX-CLEANUP] Failed to load account:`, err.message);
    process.exit(1);
  }

  // 2. Query Horizon for active offers associated with this account
  console.log("📡 [DEX-CLEANUP] Fetching active offers from Horizon...");
  let activeOffers;
  try {
    activeOffers = await horizon.offers().forAccount(publicKey).call();
    console.log(`✓ Retrieved ${activeOffers.records.length} active offer(s) from the order book.`);
  } catch (err: any) {
    console.error("❌ [DEX-CLEANUP] Failed to query active offers:", err.message);
    process.exit(1);
  }

  if (activeOffers.records.length === 0) {
    console.log("🎉 [DEX-CLEANUP] No active offers found! Your DEX footprint is already clean.");
    process.exit(0);
  }

  // 3. Build Transaction to cancel all retrieved offers
  const txBuilder = new TransactionBuilder(account, {
    fee: "100000", // 0.01 Pi/XLM base fee
    networkPassphrase: NETWORK_PASSPHRASE,
  }).setTimeout(180);

  console.log("\n🛠️ [DEX-CLEANUP] Compiling cancel operations:");
  for (const offer of activeOffers.records) {
    console.log(`   - Canceling Offer #${offer.id}: Selling ${offer.amount} of ${offer.selling.code || "native"} for ${offer.buying.code || "native"}`);
    
    // To delete an offer on the Stellar ledger, send the exact offer ID with amount "0"
    txBuilder.addOperation(
      Operation.manageSellOffer({
        selling: offer.selling,
        buying: offer.buying,
        amount: "0", // 👈 "0" cancels and tears down the offer completely
        price: offer.price,
        offerId: offer.id, // 👈 Targets the specific active offer
      })
    );
  }

  // 4. Build, sign, and display/submit
  const tx = txBuilder.build();
  tx.sign(keypair);
  const xdr = tx.toXDR();

  console.log("\n======================== CONSOLIDATED CANCEL XDR ========================");
  console.log(xdr);
  console.log("=========================================================================");
  console.log("💡 Copy the XDR block above to submit it via the Stellar Laboratory, or set BROADCAST=true to submit directly.");

  if (process.env.BROADCAST === "true") {
    console.log("\n🚀 [DEX-CLEANUP] Broadcasting clean-up transaction directly to Horizon...");
    try {
      const response = await horizon.submitTransaction(tx);
      console.log(`✅ [DEX-CLEANUP] Success! Transaction committed successfully!`);
      console.log(`   - Hash: ${response.hash}`);
      console.log(`   - Base Reserve Released!`);
    } catch (submitErr: any) {
      console.error(`❌ [DEX-CLEANUP] Broadcast failed:`, submitErr.response?.data || submitErr.message);
    }
  }
}

clearDexLiquidity().catch((err) => {
  console.error("🚨 [DEX-CLEANUP] Critical runtime crash:", err.message || err);
});
