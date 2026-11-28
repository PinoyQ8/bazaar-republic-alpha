// Location: app/api/academy/progress/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeModuleId(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toUpperCase().replace(/-/g, "_");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = (searchParams.get("uid") || "").trim();

  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Missing uid parameter", completedModules: [] },
      { status: 400 }
    );
  }

  try {
    const db = prisma as any;
    if (!db || !db.academyLog) {
      return NextResponse.json(
        { success: false, error: "Prisma client uninitialized", completedModules: [] },
        { status: 503 }
      );
    }

    const node = db.pioneerNode
      ? await db.pioneerNode.findFirst({
          where: {
            OR: [{ uid }, { username: uid }, { walletAddress: uid }],
          },
          select: {
            uid: true,
            username: true,
            walletAddress: true,
            tier: true,
            status: true,
          },
        })
      : null;

    const candidateIds = Array.from(
      new Set(
        [uid, node?.uid, node?.username, node?.walletAddress].filter(
          (v): v is string => typeof v === "string" && v.trim().length > 0
        )
      )
    );

    const logs = await db.academyLog.findMany({
      where: {
        pioneerUid: { in: candidateIds },
      },
      select: {
        moduleKey: true,
        status: true,
      },
    });

    const completedModules = Array.from(
      new Set(
        (logs || [])
          .filter((row: any) => {
            const st = String(row?.status || "COMPLETED").toUpperCase();
            return st === "COMPLETED";
          })
          .map((row: any) => normalizeModuleId(row?.moduleKey))
          .filter(Boolean)
      )
    );

    return NextResponse.json({
      success: true,
      uid: node?.uid || uid,
      tier: node?.tier || null,
      status: node?.status || null,
      completedModules,
    });
  } catch (error: any) {
    console.error("[ACADEMY_PROGRESS_GET_ERROR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load academy progress",
        completedModules: [],
      },
      { status: 500 }
    );
  }
}