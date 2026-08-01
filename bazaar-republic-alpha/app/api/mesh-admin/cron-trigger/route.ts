import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 🛡️ SECURITY SHIELD: Vercel Native Auth
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "UNAUTHORIZED: Cron Shield Active." }, { status: 403 });
    }

    // 🧮 DYNAMIC EPOCH CALCULATION
    // If it's Aug 1st, we are sweeping the July Epoch (e.g., "2026-07")
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const targetEpochMonth = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

    // 🚀 FIRE THE MASTER POST ROUTE INTERNALLY
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const sweepResponse = await fetch(`${baseUrl}/api/mesh-admin/epoch-sweep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminKey: process.env.PI_API_KEY, // Injecting the Vault Key internally
        targetEpochMonth: targetEpochMonth
      })
    });

    const sweepData = await sweepResponse.json();

    if (!sweepResponse.ok) {
      console.error("[MESH CRON] Sweep Execution Failed:", sweepData);
      return NextResponse.json({ error: "Internal Sweep Failed", details: sweepData }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cron Triggered Epoch ${targetEpochMonth} Sweep successfully.`,
      data: sweepData
    });

  } catch (error) {
    console.error("[MESH CRON] Critical Trigger Failure:", error);
    return NextResponse.json({ error: "Cron execution collapsed." }, { status: 500 });
  }
}