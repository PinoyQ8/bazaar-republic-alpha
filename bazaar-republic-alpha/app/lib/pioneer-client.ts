// 🛡️ THE MESH BRIDGE: Module Defined
export const pioneerClient = async (uid: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }), // uid now recognized within scope
    });

    return await response.json();
  } catch (error) {
    console.error("[MESH-SCAN] Client Fetch Failed:", error);
    return null;
  }
};