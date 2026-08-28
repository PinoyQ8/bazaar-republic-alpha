// Location: /lib/pioneer-client.ts (or equivalent API utility file)

export async function pioneerClient(pioneerId: string) {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST', // Assuming this uses POST based on your terminal logs
      headers: {
        'Content-Type': 'application/json',
        // 1. Injects the handshake token to bypass the 403 fracture
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN}`,
        // 2. Defines the routing logic to bypass the UNKNOWN_SECTOR fracture
        'x-target-sector': 'treasury' 
      },
      body: JSON.stringify({
        // ... whatever payload pioneerClient was already sending ...
        pioneerId: pioneerId,
        action: 'FETCH_TREASURY_DATA' // Ensure your proxy handles this gracefully if needed
      })
    });

    if (!response.ok) {
      throw new Error(`Proxy Bridge Blocked: Status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[MESH-SCAN] pioneerClient fetch failed:", error);
    throw error;
  }
}