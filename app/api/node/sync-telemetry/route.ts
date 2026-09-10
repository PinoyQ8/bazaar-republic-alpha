// Location: app/api/node/sync-telemetry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Point strictly to your single unified Prisma client [cite: 144]

export const dynamic = "force-dynamic";

interface OfflineTx {
  txId: string;
  type: "ESCROW_LOCK" | "MEMBER_VOTE" | "TELEMETRY_PING";
  payload: any;
  timestamp: number;
}

/**
 * 🛰️ POST: RECEIVE, DE-DUPLICATE, AND COMMIT OFFLINE BATCHES ATOMICALLY TO BZR-DB
 * Integrates secure X-Idempotency-Keys to prevent duplicate database writes [cite: 30],
 * and runs within a transactional loop to maintain zero math drift and total integrity.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const transactions: OfflineTx[] = body.data || [];
    const idempotencyKey = req.headers.get("x-idempotency-key");

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY: No offline transaction data array provided." },
        { status: 400 }
      );
    }

    const prismaClient = db as any;

    // 🛡️ 1. Idempotency Check: Prevent duplicate processing of the same sync block [cite: 30]
    if (idempotencyKey && prismaClient.auditLog) {
      const existingSync = await prismaClient.auditLog.findFirst({
        where: {
          action: "BATCH_SYNC_EXECUTED",
          txHash: idempotencyKey,
        },
      });

      if (existingSync) {
        console.warn(`[SYNC-DAEMON] Batch with key "${idempotencyKey}" already processed. Skipping duplicate write.`);
        return NextResponse.json({
          success: true,
          status: "ALREADY_PROCESSED",
          message: `Idempotence verified. Batch sync '${idempotencyKey}' was committed previously.`,
          syncedCount: 0,
        });
      }
    }

    const results: any[] = [];

    // 🛡️ 2. Execute Transactionally: Ensure all sync records succeed or fail together [cite: 32, 60]
    await prismaClient.$transaction(async (tx: any) => {
      for (const txItem of transactions) {
        const { txId, type, payload, timestamp } = txItem;
        const txDate = timestamp ? new Date(timestamp) : new Date();

        switch (type) {
          case "TELEMETRY_PING": {
            const targetUid = payload.uid || payload.pioneerId || payload.walletAddress || payload.nodeId;
            const cpuUsage = payload.cpuUsage !== undefined ? Number(payload.cpuUsage) : 0.0;
            const ramUsage = payload.ramUsage !== undefined ? Number(payload.ramUsage) : 0.0;
            const uptimeShield = payload.uptimeShield !== undefined ? Number(payload.uptimeShield) : 100.0;

            if (!targetUid) {
              results.push({ txId, status: "SKIPPED", error: "Missing node identifier in payload" });
              continue;
            }

            // Find matching node
            let node = await tx.pioneerNode.findFirst({
              where: {
                OR: [
                  { uid: targetUid },
                  { walletAddress: targetUid },
                  { username: targetUid },
                ],
              },
            });

            // Cold Onboarding fallback [cite: 32]
            if (!node) {
              node = await tx.pioneerNode.create({
                data: {
                  uid: targetUid,
                  username: targetUid,
                  walletAddress: payload.walletAddress || null,
                  status: "ACTIVE",
                  tier: "CITIZEN",
                  trustScore: 100,
                  uptimeShield: uptimeShield,
                  lastActivityTimestamp: txDate,
                  lastHeartbeat: txDate,
                  protocol: "28",
                  dailyActiveMinutes: 0,
                  consecutiveActiveDays: 1,
                  cpuUsage: cpuUsage,
                  ramUsage: ramUsage,
                },
              });
              results.push({ txId, status: "REGISTERED", nodeId: node.id });
              continue;
            }

            // Skip quarantined nodes [cite: 32]
            if (node.isFrozen || node.status === "FROZEN" || node.quarantineStatus === "QUARANTINED") {
              results.push({ txId, status: "DENIED", message: "Node is quarantined or frozen." });
              continue;
            }

            // Accumulate active engagement minutes safely with 120-minute cap [cite: 32]
            let incrementMinute = 0;
            if ((node.dailyActiveMinutes ?? 0) < 120) {
              incrementMinute = 1;
            }

            const updatedNode = await tx.pioneerNode.update({
              where: { id: node.id },
              data: {
                lastActivityTimestamp: txDate,
                lastHeartbeat: txDate,
                status: "ACTIVE",
                uptimeShield: node.uptimeShield ?? uptimeShield,
                cpuUsage: cpuUsage,
                ramUsage: ramUsage,
                dailyActiveMinutes: { increment: incrementMinute },
              },
            });

            results.push({
              txId,
              status: "UPDATED",
              nodeId: updatedNode.id,
              dailyActiveMinutes: updatedNode.dailyActiveMinutes,
            });
            break;
          }

          case "MEMBER_VOTE": {
            if (tx.elderVote) {
              const vote = await tx.elderVote.create({
                data: {
                  disputeCaseId: payload.disputeCaseId || payload.caseId,
                  elderAddress: payload.elderAddress || payload.walletAddress,
                  vote: payload.vote,
                  signature: payload.signature || `offline_sig_${txId}`,
                  votedAt: txDate,
                },
              });

              // Accompany with audit log for blockchain verifiability [cite: 32]
              if (tx.auditLog) {
                await tx.auditLog.create({
                  data: {
                    action: "ELDER_VOTE_SYNC",
                    actorAddress: payload.elderAddress || payload.walletAddress || "OFFLINE_SYNC",
                    txHash: txId,
                    details: `Offline synced vote casted. Vote: ${payload.vote}. CaseID: ${payload.disputeCaseId}`,
                    createdAt: txDate,
                  },
                });
              }

              results.push({ txId, status: "VOTE_RECORDED", voteId: vote.id });
            } else {
              results.push({ txId, status: "SKIPPED", error: "elderVote model unavailable" });
            }
            break;
          }

          case "ESCROW_LOCK": {
            // Document the escrow locking transaction inside the decentralized audit logs [cite: 32]
            if (tx.auditLog) {
              const log = await tx.auditLog.create({
                data: {
                  action: "ESCROW_LOCK_SYNC",
                  actorAddress: payload.consumerUid || payload.walletAddress || "OFFLINE_SYNC",
                  txHash: txId,
                  details: `Offline synced escrow lock. Amount: ${payload.amount} PI at store: ${payload.storeName || "Unknown"} [cite: 111]`,
                  createdAt: txDate,
                },
              });
              results.push({ txId, status: "ESCROW_LOGGED", logId: log.id });
            } else {
              results.push({ txId, status: "SKIPPED", error: "auditLog model unavailable" });
            }
            break;
          }

          default:
            results.push({ txId, status: "SKIPPED", error: `Unknown transaction type: ${type}` });
            break;
        }
      }

      // 🛡️ 3. Commit Idempotency Log: Prevent this batch from ever being synced again [cite: 30]
      if (idempotencyKey && tx.auditLog) {
        await tx.auditLog.create({
          data: {
            action: "BATCH_SYNC_EXECUTED",
            actorAddress: "OFFLINE_SYNC_DAEMON",
            txHash: idempotencyKey,
            details: `Successfully synchronized batch of ${transactions.length} offline transactions.`,
            createdAt: new Date(),
          },
        });
      }
    });

    console.log(`[SYNC-DAEMON] Successfully processed and committed batch. Key: ${idempotencyKey}`);
    return NextResponse.json({
      success: true,
      status: "SYNC_COMPLETE",
      syncedCount: transactions.length,
      results,
    });

  } catch (error: any) {
    console.error("[SYNC-DAEMON-FAIL] Critical failure during transactional sync batch commit:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Critical database transaction failure." },
      { status: 500 }
    );
  }
}
