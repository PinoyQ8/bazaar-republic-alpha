import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, txid } = await req.json();
    const apiKey = process.env.PI_API_KEY || "crhemiha5dwgptxjldpyjvl2a1ee7xrfy4tpbfukjkqo0ry58kmocmndh69hswom";

    console.log(`[PI-COMPLETE] Completing payment ${paymentId} with txid ${txid}...`);

    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ txid })
    });

    const data = await piRes.json();
    if (!piRes.ok) {
      console.error("[PI-COMPLETE REJECTED]", data);
      return NextResponse.json({ success: false, error: data }, { status: piRes.status });
    }

    return NextResponse.json({ success: true, payment: data });
  } catch (err: any) {
    console.error("[PI-COMPLETE CRASH]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
