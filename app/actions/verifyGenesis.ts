"use server";

import { cookies } from 'next/headers'; // 🛡️ VAULT INJECTION: Required for the State Lock

interface HandshakeResponse {
  success: boolean;
  message: string;
  username?: string; 
  tier?: string;
  anchor?: string;
  access?: string[];
}

// 🛡️ IMMUTABLE PIONEER REGISTRY: The Foundation of the Security Circle
const PIONEER_REGISTRY: Record<string, { displayName: string; tier: string; anchor: string; access: string[] }> = Object.freeze({
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
  
  // 🛰️ SECURITY CIRCLE EXPANSION SLOTS
  "alpha_6": { displayName: "Alpha_6", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  "alpha_7": { displayName: "Alpha_7", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  "alpha_8": { displayName: "Alpha_8", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  "alpha_9": { displayName: "Alpha_9", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  "alpha_10": { displayName: "Alpha_10", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
  "alpha_11": { displayName: "Alpha_11", tier: "SECURITY CIRCLE", anchor: "GENESIS ALPHA", access: ["SECURITY_CIRCLE", "FIRESIDE_FORUM"] },
});

export async function verifyGenesisNode(username: string, passcode: string): Promise<HandshakeResponse> {
  // 🛡️ MESH-SCAN: Normalizing input for registry lookup
  const inputKey = username.trim().toLowerCase();
  const pioneerData = PIONEER_REGISTRY[inputKey];

  if (!pioneerData) {
    console.warn(`MESH Alert: Unauthorized entry attempt by [${inputKey}].`);
    return { success: false, message: "IDENTITY REJECTED: NOT IN ALPHA REGISTRY." };
  }

  // 🛡️ VAULT CHECK: Verifying against the Vercel Environment Variable
  if (passcode !== process.env.GENESIS_PASSCODE) {
    console.warn(`MESH Alert: Invalid hash provided for [${pioneerData.displayName}].`);
    return { success: false, message: "SECURITY ADJUDICATOR: INVALID HASH." };
  }

  // --- 🛡️ THE STATE LOCK: Forging the HttpOnly Cookie ---
  // Note: Next.js requires cookies() to be awaited in Server Actions
  const cookieStore = await cookies();
  
  cookieStore.set({
    name: 'mesh_session_token',
    value: passcode, // Securing the verified payload in the protected cookie
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7-day session shield
  });

  console.log(`MESH Log: Genesis Node [${pioneerData.displayName}] locked and secured.`);

  // 🛡️ BRIDGE STABLE: Returning the verified Pioneer identity
  return { 
    success: true, 
    message: "MESH SYNCHRONIZED",
    username: pioneerData.displayName, 
    tier: pioneerData.tier,
    anchor: pioneerData.anchor,
    access: pioneerData.access
  };
}