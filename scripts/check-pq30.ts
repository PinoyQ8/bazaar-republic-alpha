import { BazaarVaultService } from "../services/bazaarVaultService";

async function main() {
  const contractId = "CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV";
  const vaultService = new BazaarVaultService(contractId);
  const record = await vaultService.getVault("PQ30_01");
  console.log("Current PQ30_01 record:", record);
  if (record) {
    console.log({
      status: record.status,
      amountStroops: String(record.amount),
      consumer: record.consumer,
      provider: record.provider,
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
