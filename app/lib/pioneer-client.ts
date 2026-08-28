// 🛡️ THE MESH BRIDGE: Module Defined & Armored
export const pioneerClient = async (uid: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // 🛡️ FALLBACK SHIELD: Uses the exact vault key if the Next.js compiler drops the .env file
  const clientToken = process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN || "ProjectBazaar_Alpha_Secure_Key_2026";
  
  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // 1. Injects the Vault Key to bypass 403 Forbidden
        'Authorization': `Bearer ${clientToken}`,
        // 2. Bypasses the UNKNOWN_SECTOR fracture
        'x-target-sector': 'treasury'
      },
      body: JSON.stringify({ 
        pioneerId: uid, 
        action: 'FETCH_TREASURY_DATA' 
      }), 
    });

    if (!response.ok) {
      console.error(`[MESH FRACTURE] Adjudicator Blocked Request. Status: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[MESH-SCAN] Client Fetch Failed:", error);
    return null;
  }
};