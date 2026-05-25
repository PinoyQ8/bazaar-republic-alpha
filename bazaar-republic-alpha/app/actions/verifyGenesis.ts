"use server";

import { cookies } from 'next/headers'; 

interface HandshakeResponse {
  success: boolean;
  message: string;
  username?: string; 
  tier?: string;
  anchor?: string;
  access?: string[];
}

// 🛡️ IMMUTABLE PIONEER REGISTRY
const PIONEER_REGISTRY: Record<string, { displayName: string; tier: string; anchor: string; access: string[] }> = Object.freeze({
  "pinoyq8": { displayName: "PinoyQ8", tier: "FOUNDER", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "DEVELOPER", "FIRESIDE_FORUM"] },
  "mommydors": { displayName: "Mommydors", tier: "FOUNDER SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "SENIOR_CHAT", "FIRESIDE_FORUM"] },
  "ncframos": { displayName: "ncframos", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  "zabrinaaaramos": { displayName: "zabrinaaaramos", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  "melsan58": { displayName: "melsan58", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  "alpha_6": { displayName: "Alpha_6", tier: "ALPHA_TESTER", anchor: "GENESIS ALPHA", access: ["FIRESIDE_FORUM"] },
  "alpha_7": { displayName: "Alpha_7", tier: "ALPHA_TESTER", anchor: "GENESIS ALPHA", access: ["FIRESIDE_FORUM"] },
});

export async function verifyGenesisNode(username: string, passcode: string): Promise<HandshakeResponse> {
  const inputKey = username.trim().toLowerCase();
  const pioneerData = PIONEER_REGISTRY[inputKey];

  // 🛡️ 1. THE REGISTRY WHITELIST
  if (!pioneerData) {
    console.warn(`[MESH-SCAN] Unauthorized entry attempt by [${inputKey}].`);
    return { success: false, message: "IDENTITY REJECTED: NOT IN ALPHA REGISTRY." };
  }

  // 🛡️ 2. TIERED CRYPTOGRAPHIC ROUTING
  let expectedHash = "";
  
  if (pioneerData.tier === "FOUNDER" || pioneerData.tier === "FOUNDER SECURITY CIRCLE") {
    expectedHash = process.env.FOUNDER_PASSCODE || "MISSING_FOUNDER_ENV";
  } else if (pioneerData.tier === "SECURITY CIRCLE") {
    expectedHash = process.env.SC_PASSCODE || "MISSING_SC_ENV";
  } else {
    expectedHash = process.env.ALPHA_PASSCODE || "MISSING_ALPHA_ENV";
  }

  // 🛡️ 3. THE COMPARTMENTALIZED LOCK
  if (passcode !== expectedHash) {
    console.warn(`[MESH-SCAN] Invalid hash provided for [${pioneerData.displayName}]. Intrusion blocked.`);
    return { success: false, message: "SECURITY ADJUDICATOR: INVALID HASH." };
  }

  // --- 🛡️ THE STATE LOCK: Forging the HttpOnly Cookie ---
  const cookieStore = await cookies();
  
  cookieStore.set({
    name: 'mesh_session_token',
    value: passcode, 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 
  });

  console.log(`[MESH-SCAN] Genesis Node [${pioneerData.displayName}] locked and secured.`);

  return { 
    success: true, 
    message: "MESH SYNCHRONIZED",
    username: pioneerData.displayName, 
    tier: pioneerData.tier,
    anchor: pioneerData.anchor,
    access: pioneerData.access
  };
}