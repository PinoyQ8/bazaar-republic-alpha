import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await req.json().catch(() => null);

    return NextResponse.json(
      {
        success: false,
        status: "MIGRATING",
        message: "Treasury allocation engine is currently offline for storage alignment.",
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error("[TREASURY_ALLOCATE_ROUTE_ERROR]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Allocation routing failed." },
      { status: 500 }
    );
  }
}