import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { BazaarVaultService } from "../services/bazaarVaultService";

const CONTRACT_ID = "CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV";
const TOKEN_CONTRACT = "CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ";
const CONSUMER_ADDR = "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";
const PROVIDER_ADDR = "GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW";
const ESCROW_ID = "PQ30_06";
const AMOUNT_STROOPS = 10_000_000n;
const DURATION_SECS = 3600n;
const TEST_NONCE = 2;

function getSigner(): Keypair {
  const rawSecret = String(
    process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.OPERATOR_STELLAR_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      ""
  )
    .replace(/["'\r\n]/g, "")
    .trim();

  if (!rawSecret || !StrKey.isValidEd25519SecretSeed(rawSecret)) {
    throw new Error("Missing valid signer secret in environment.");
  }
  return Keypair.fromSecret(rawSecret);
}

async function main() {
  const signer = getSigner();
  const vaultService = new BazaarVaultService(CONTRACT_ID);

  let record = await vaultService.getVault(ESCROW_ID);
  if (!record) {
    console.log("1) Locking escrow on-chain:", ESCROW_ID);
    const lockRes = await (vaultService as any).lockFunds(
      {
        escrowId: ESCROW_ID,
        tokenContract: TOKEN_CONTRACT,
        consumerAddress: CONSUMER_ADDR,
        providerAddress: PROVIDER_ADDR,
        amountStroops: AMOUNT_STROOPS,
        amount: AMOUNT_STROOPS,
        durationSecs: DURATION_SECS,
      },
      signer
    );
    console.log("   lockFunds tx:", lockRes.hash || lockRes);
    record = await vaultService.getVault(ESCROW_ID);
  }

  if (String(record?.status || "") === "Locked") {
    console.log("2) Marking escrow disputed on-chain:", ESCROW_ID);
    const dispRes = await vaultService.disputeEscrow(
      ESCROW_ID,
      CONSUMER_ADDR,
      signer
    );
    console.log("   disputeEscrow tx:", dispRes.hash || dispRes);
    record = await vaultService.getVault(ESCROW_ID);
  }

  const liveAmountStroops = BigInt(record?.amount ?? AMOUNT_STROOPS);
  console.log("3) Live on-chain vault state:", {
    escrowId: ESCROW_ID,
    status: record?.status,
    amountStroops: liveAmountStroops.toString(),
  });

  console.log(`4) Calling POST /api/escrow/dispute/resolve with nonce=${TEST_NONCE}...`);
  const apiRes = await fetch("http://localhost:3000/api/escrow/dispute/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      escrowId: ESCROW_ID,
      contractId: CONTRACT_ID,
      ruling: "FAVOR_MERCHANT",
      adminAddress: CONSUMER_ADDR,
      payoutToAddress: PROVIDER_ADDR,
      amountStroops: liveAmountStroops.toString(),
      nonce: TEST_NONCE,
    }),
  });

  const json = await apiRes.json();
  console.log("HTTP Status:", apiRes.status);
  console.log(JSON.stringify(json, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
