import {
  Asset,
  Operation,
  TransactionBuilder,
  Keypair,
  Networks,
  Horizon,
} from "@stellar/stellar-sdk";

/**
 * 🪙 BAZAAR REPUBLIC: Fixed 1:1,000 Peg DEX Offer Compiler (v1.0.0)
 * ----------------------------------------------------------------------------
 * This script demonstrates how to compile, sign, and optionally broadcast a
 * perfectly peg-aligned limit sell offer on the Stellar/Pi Testnet DEX.
 * 
 * Target Peg: 1 Test-Pi = 1,000 mBZR
 * 1 mBZR = 0.001 Test-Pi (Price ratio: 1 / 1000)
 * ----------------------------------------------------------------------------
 * Motto: "In code we trust"
 * © BAZAAR REPUBLIC
 */

// Configure network parameters
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET; // "Test SDF Network ; September 2015"

// Configure asset & account coordinates
const PIONEER_SECRET = process.env.PIONEER_SIGNER_SECRET || "YOUR_SECRET_KEY"; // GCUFYY... matching key
const ISSUER_PUBLIC = "GCD4GW27B2PQZGJGLCAQYEAEKDDDGWY7U6CHNSFY6AOEUBLEU3FGWG4D"; // mBZR Token Issuer
const ASSET_CODE = "mBZR";

async function compilePeggedOffer() {
  console.log("📡 [DEX-ALIGN] Initializing 1:1,000 Peg Transaction Compiler...");

  if (PIONEER_SECRET === "YOUR_SECRET_KEY") {
    console.error("❌ [DEX-ALIGN] Please supply a valid PIONEER_SIGNER_SECRET in your environment or code.");
    process.exit(1);
  }

  const keypair = Keypair.fromSecret(PIONEER_SECRET);
  const sourcePublicKey = keypair.publicKey();
  console.log(`👤 [DEX-ALIGN] Source Account: ${sourcePublicKey}`);

  // 1. Establish Horizon client and load the account state
  const horizon = new Horizon.Server(HORIZON_URL);
  let account;
  try {
    account = await horizon.loadAccount(sourcePublicKey);
    console.log(`✓ Account loaded successfully (Sequence: ${account.sequenceNumber()})`);
  } catch (err: any) {
    console.error(`❌ [DEX-ALIGN] Failed to load account:`, err.message || err);
    process.exit(1);
  }

  // 2. Define Assets
  const sellingAsset = new Asset(ASSET_CODE, ISSUER_PUBLIC);
  const buyingAsset = Asset.native(); // Test-Pi (Native XLM equivalent on sandbox)

  // 3. Define Amount and Aligned Price
  // We want to sell 1,000 mBZR.
  const amountToSell = "1000.0000000"; 

  // To maintain the 1:1,000 peg (1 mBZR = 0.001 Pi):
  // Price represents (buying units / selling units) -> 0.001 Pi per 1 mBZR = 1 / 1000
  const price = {
    n: 1,      // Numerator: 1 unit of Test-Pi
    d: 1000,   // Denominator: 1000 units of mBZR
  };

  console.log(`💰 [DEX-ALIGN] Offering:`);
  console.log(`   - Selling: ${amountToSell} mBZR`);
  console.log(`   - Price: ${price.n}/${price.d} (${price.n / price.d} Pi per mBZR)`);
  console.log(`   - Target Value: ${parseFloat(amountToSell) * (price.n / price.d)} Test-Pi`);

  // 4. Build the ManageSellOffer Operation
  const manageSellOfferOp = Operation.manageSellOffer({
    selling: sellingAsset,
    buying: buyingAsset,
    amount: amountToSell,
    price: price,
    offerId: "0", // 0 creates a new offer, any other ID updates or deletes it
  });

  // 5. Compile the Transaction Envelope
  const tx = new TransactionBuilder(account, {
    fee: "100000", // 0.01 Pi network fee
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .setTimeout(180) // 3-minute grace period
    .addOperation(manageSellOfferOp)
    .build();

  // 6. Sign and Export Envelope XDR
  tx.sign(keypair);
  const xdrBase64 = tx.toXDR();

  console.log("\n========================= DECIDED PEGGED XDR =========================");
  console.log(xdrBase64);
  console.log("======================================================================\n");
  console.log("💡 Copy the XDR above and submit it to:");
  console.log("   👉 https://laboratory.stellar.org/#txsigner (Stellar Transaction Signer/Submitter)");
  console.log("   👉 Or submit programmatically using Horizon Server.");

  // 7. Optional direct broadcast
  const BROADCAST_DIRECT = process.env.BROADCAST_DIRECT === "true";
  if (BROADCAST_DIRECT) {
    console.log("🚀 [DEX-ALIGN] Broadcasting transaction directly to network...");
    try {
      const response = await horizon.submitTransaction(tx);
      console.log(`✅ [DEX-ALIGN] Success! Transaction committed successfully!`);
      console.log(`   - Ledger Sequence: ${response.ledger}`);
      console.log(`   - Transaction ID: ${response.hash}`);
    } catch (submitErr: any) {
      console.error(`❌ [DEX-ALIGN] Broadcast failure:`, submitErr.response?.data || submitErr.message);
    }
  }
}

compilePeggedOffer()
  .catch((err) => {
    console.error("❌ Fatal Compile Error:", err);
    process.exit(1);
  });
