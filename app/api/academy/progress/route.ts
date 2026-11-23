import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid")?.trim();

  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Missing uid parameter", completedModules: [] },
      { status: 400 }
    );
  }

  try {
    const logs = await (prisma as any).academyLog.findMany({
      where: { pioneerUid: uid },
    });

    const completedModules = Array.from(
      new Set(
        (logs || [])
          .map((row: any) => row.moduleLocked || row.moduleKey)
          .filter(Boolean)
      )
    );

    return NextResponse.json({
      success: true,
      uid,
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