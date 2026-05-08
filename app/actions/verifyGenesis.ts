"use server";

interface HandshakeResponse {
  success: boolean;
  message: string;
  username?: string; 
  tier?: string;
  anchor?: string;
  access?: string[];
}

export async function verifyGenesisNode(username: string, passcode: string): Promise<HandshakeResponse> {
  const PIONEER_REGISTRY: Record<string, { displayName: string; tier: string; anchor: string; access: string[] }> = {
    // 🏛️ THE CORE FOUNDATION
    "pinoyq8": { 
      displayName: "PinoyQ8", 
      tier: "FOUNDER", 
      anchor: "GENESIS ALPHA", 
      access: ["SECURITY_CIRCLE", "DEVELOPER", "FIRESIDE_FORUM"] 
    },
    "mommydors": { 
      displayName: "Mommydors", 
      tier: "FOUNDER SECURITY CIRCLE", 
      anchor: "GENESIS ALPHA", 
      access: ["SECURITY_CIRCLE", "SENIOR_CHAT", "FIRESIDE_FORUM"] 
    },
    // 🛡️ INITIAL SECURITY CIRCLE
    "ncframos": { displayName: "ncframos", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
    "zabrinaaaramos": { displayName: "zabrinaaaramos", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
    "melsan58": { displayName: "melsan58", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
    
    // 🛰️ SECURITY CIRCLE EXPANSION SLOTS (Awaiting IDs)
    "alpha_6": { displayName: "Alpha_6", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
    "alpha_7": { displayName: "Alpha_7", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
    "alpha_8": { displayName: "Alpha_8", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
    "alpha_9": { displayName: "Alpha_9", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
    "alpha_10": { displayName: "Alpha_10", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
    "alpha_11": { displayName: "Alpha_11", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  };

  // 🛡️ CASE-TRANSPARENT LOGIC: Normalize input for registry lookup
  const inputKey = username.trim().toLowerCase();
  const pioneerData = PIONEER_REGISTRY[inputKey];

  if (!pioneerData) {
    return { success: false, message: "IDENTITY NOT IN ALPHA REGISTRY." };
  }

  if (passcode !== process.env.GENESIS_PASSCODE) {
    return { success: false, message: "INVALID HASH." };
  }

  return { 
    success: true, 
    message: "VERIFIED",
    username: pioneerData.displayName, // 🛡️ UI reflects the Proper Case
    tier: pioneerData.tier,
    anchor: pioneerData.anchor,
    access: pioneerData.access
  };
}