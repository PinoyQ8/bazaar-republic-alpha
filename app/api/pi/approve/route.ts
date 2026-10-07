import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json();
    const apiKey = process.env.PI_API_KEY || "crhemiha5dwgptxjldpyjvl2a1ee7xrfy4tpbfukjkqo0ry58kmocmndh69hswom";

    console.log(`[PI-APPROVE] Approving payment ${paymentId} with Pi Platform API...`);

    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    const data = await piRes.json();
    if (!piRes.ok) {
      console.error("[PI-APPROVE REJECTED]", data);
      return NextResponse.json({ success: false, error: data }, { status: piRes.status });
    }

    return NextResponse.json({ success: true, payment: data });
  } catch (err: any) {
    console.error("[PI-APPROVE CRASH]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
