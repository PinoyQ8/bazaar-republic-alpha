// scripts/stream-mainnet-ops.ts
import fs from "fs";
import path from "path";
import EventSource from "eventsource";

const HORIZON_MAINNET = "https://api.mainnet.minepi.com";
const OUTPUT_FILE = path.join(process.cwd(), "mainnet_ops_stream.jsonl");
let lastProcessedCursor = "now"; // Change to a specific operation cursor if resuming

console.log(`🚀 [EXPLORER] Starting In-Memory Mainnet Ingestion Stream...`);
console.log(`📁 Saving data stream directly to: ${OUTPUT_FILE}`);

const streamUrl = `${HORIZON_MAINNET}/operations?cursor=${lastProcessedCursor}&order=asc`;
const es = new EventSource(streamUrl);

es.onmessage = (event) => {
  try {
    const op = JSON.parse(event.data);
    if (!op.id) return;

    lastProcessedCursor = op.paging_token;

    // Filter payments and muxed accounts for Layer-2 research
    const logEntry = {
      operationId: op.id,
      pagingToken: op.paging_token,
      type: op.type,
      sourceAccount: op.source_account,
      from: op.from || null,
      to: op.to || null,
      toMuxed: op.to_muxed || null,
      toMuxedId: op.to_muxed_id || null,
      amount: op.amount ? parseFloat(op.amount) : null,
      transactionHash: op.transaction_hash,
      createdAt: op.created_at,
    };

    // Append raw telemetry line to disk
    fs.appendFileSync(OUTPUT_FILE, JSON.stringify(logEntry) + "\n");

    const amountFormatted = logEntry.amount ? `${logEntry.amount.toFixed(4)} π` : "N/A";
    const muxedInfo = logEntry.toMuxedId ? `[MUXED_ID: ${logEntry.toMuxedId}]` : "";
    console.log(`⚡ [OP #${op.paging_token}] Type: ${op.type.padEnd(14)} | ${amountFormatted} ${muxedInfo}`);
  } catch (parseErr: any) {
    console.warn("⚠️ JSON parse error:", parseErr.message);
  }
};

es.onerror = (err) => {
  console.error("⚠️ [STREAM DISCONNECT] Horizon connection interrupted, reconnecting...", err);
};

process.on("SIGINT", () => {
  console.log(`\n🛑 Stream stopped. Last cursor processed: ${lastProcessedCursor}`);
  es.close();
  process.exit(0);
});