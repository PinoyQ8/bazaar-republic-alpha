import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PI_API_BASE = "https://api.minepi.com/v2";

async function settleIdempotently(params: {
  txid: string;
  amount: number;
  requestedUid: string;
  piUserUid?: string;
}) {
  const { txid, amount, requestedUid, piUserUid } = params;
  const db = prisma as any;
  const existingLog = db.ledgerLog
    ? await db.ledgerLog.findFirst({ where: { txHash: txid } })
    : null;

  const lookupUid = requestedUid || existingLog?.uid || piUserUid || "";
  let updatedNode: any = null;
  let idempotentReplay = Boolean(existingLog);

  try {
    if (!existingLog) {
      await db.$transaction(async (tx: any) => {
        if (tx.ledgerLog) {
          await tx.ledgerLog.create({
            data: {
              uid: lookupUid || "UNKNOWN_PIONEER",
              amount: String(amount),
              asset: "PI",
              txHash: txid,
              status: "COMPLETED",
            },
          });
        }

        if (lookupUid && Number.isFinite(amount) && amount > 0 && tx.pioneerNode) {
          const targetNode = await tx.pioneerNode.findUnique({
            where: { uid: lookupUid },
          });
          if (targetNode) {
            updatedNode = await tx.pioneerNode.update({
              where: { uid: lookupUid },
              data: {
                stakedPi: { increment: amount },
                lastActivityTimestamp: new Date(),
              },
            });
          } else {
            console.warn(
              `[PI-COMPLETE] PioneerNode [${lookupUid}] not found; stakedPi not incremented.`
            );
          }
        }
      });
    } else if (lookupUid && lookupUid !== "UNKNOWN_PIONEER" && db.pioneerNode) {
      updatedNode = await db.pioneerNode.findUnique({ where: { uid: lookupUid } });
    }
  } catch (dbErr: any) {
    console.warn("[PI-COMPLETE DB WARN]", dbErr?.message || dbErr);
  }

  return { idempotentReplay, updatedNode };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const paymentId =
      typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    const txid = typeof body?.txid === "string" ? body.txid.trim() : "";
    const requestedUid =
      typeof (body?.uid ?? body?.pioneerUid) === "string"
        ? String(body.uid ?? body.pioneerUid).trim()
        : "";

    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, error: "Both paymentId and txid are required." },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // 1. Short-circuit known txid replays before hitting Pi Platform
    const existingLog = db.ledgerLog
      ? await db.ledgerLog.findFirst({ where: { txHash: txid } })
      : null;

    if (existingLog) {
      const settled = await settleIdempotently({
        txid,
        amount: Number(existingLog.amount ?? 0),
        requestedUid,
      });
      return NextResponse.json({
        success: true,
        asset: "PI",
        paymentId,
        txid,
        idempotentReplay: true,
        telemetry: settled.updatedNode
          ? {
              pioneerUid: settled.updatedNode.uid,
              stakedPi: settled.updatedNode.stakedPi,
              mbzrBalance: settled.updatedNode.mbzrBalance,
              mintedPiTotal: settled.updatedNode.mintedPiTotal,
            }
          : undefined,
      });
    }

    const apiKey = process.env.PI_API_KEY?.trim();
    if (!apiKey) {
      console.error("[PI-COMPLETE] PI_API_KEY is missing in server environment.");
      return NextResponse.json(
        { success: false, error: "Server PI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    console.log(`[PI-COMPLETE] Completing payment ${paymentId} with txid ${txid}...`);

    const piRes = await fetch(
      `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
        signal: AbortSignal.timeout(8000),
      }
    );

    const data = await piRes.json().catch(() => ({}));
    if (!piRes.ok) {
      const alreadyCompleted =
        data?.error === "already_completed" &&
        data?.payment?.status?.developer_completed === true;

      if (alreadyCompleted) {
        const paymentObj = data.payment;
        const settled = await settleIdempotently({
          txid: paymentObj?.transaction?.txid || txid,
          amount: Number(paymentObj?.amount ?? 0),
          requestedUid,
          piUserUid: String(paymentObj?.user_uid || "").trim(),
        });

        return NextResponse.json({
          success: true,
          asset: "PI",
          paymentId,
          txid: paymentObj?.transaction?.txid || txid,
          idempotentReplay: true,
          payment: paymentObj,
          telemetry: settled.updatedNode
            ? {
                pioneerUid: settled.updatedNode.uid,
                stakedPi: settled.updatedNode.stakedPi,
                mbzrBalance: settled.updatedNode.mbzrBalance,
                mintedPiTotal: settled.updatedNode.mintedPiTotal,
              }
            : undefined,
        });
      }

      console.error("[PI-COMPLETE REJECTED]", piRes.status, data);
      return NextResponse.json(
        {
          success: false,
          error: data?.message || "Pi Platform rejected payment completion.",
          details: data,
        },
        { status: piRes.status }
      );
    }

    const verifiedAmount = Number(data?.amount ?? 0);
    const settled = await settleIdempotently({
      txid,
      amount: verifiedAmount,
      requestedUid,
      piUserUid: String(data?.user_uid || "").trim(),
    });

    return NextResponse.json({
      success: true,
      asset: "PI",
      paymentId,
      txid,
      idempotentReplay: settled.idempotentReplay,
      payment: data,
      telemetry: settled.updatedNode
        ? {
            pioneerUid: settled.updatedNode.uid,
            stakedPi: settled.updatedNode.stakedPi,
            mbzrBalance: settled.updatedNode.mbzrBalance,
            mintedPiTotal: settled.updatedNode.mintedPiTotal,
          }
        : undefined,
    });
  } catch (err: any) {
    console.error("[PI-COMPLETE CRASH]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error completing Pi payment." },
      { status: 500 }
    );
  }
}
