import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // 🛡️ FIX: Added 'request' before .json()
        const { accessToken, claimData } = await request.json();

        // 🛡️ SHIELD 1: THE CRYPTOGRAPHIC HANDSHAKE
        const verifyResponse = await fetch('https://api.minepi.com/v2/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!verifyResponse.ok) {
            return NextResponse.json({ error: "HANDSHAKE_FAILED: Invalid Pioneer Token" }, { status: 401 });
        }

        const pioneerData = await verifyResponse.json();
        const verifiedUid = pioneerData.uid; 

        console.log(`[MESH-SCAN]: Verified Reclaim Request for: ${verifiedUid}`);

        return NextResponse.json({ 
            success: true, 
            message: "IDENTITY_VERIFIED: Reclaim sequence initiated." 
        });

    } catch (error) {
        // 🛡️ ERROR MAPPING: Prevents leaking system internals
        console.error("[MESH-SCAN] API Fracture:", error);
        return NextResponse.json({ error: "SYSTEM_FRACTURE: Internal Logic Error" }, { status: 500 });
    }
}
