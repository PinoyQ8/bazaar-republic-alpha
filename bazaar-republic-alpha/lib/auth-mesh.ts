// 🛡️ MESH PROTOCOL: WEB-CRYPTO SESSION FIREWALL
import { SignJWT, jwtVerify } from 'jose'; 

// 1. Extract the secure cluster key from the vault environment array
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("[MESH-SCAN] WARNING: JWT_SECRET missing from environment. Falling back to temporary debug anchor.");
}

// Convert string key into a crypto-ready Uint8Array buffer layout
const secretKey = new TextEncoder().encode(JWT_SECRET || "fallback_mesh_vault_secret_key_92_uptime");

export interface MeshSessionPayload {
  pioneerUid: string;
  role: string;
}

/**
 * 🔒 SIGN ENCRYPTED HANDSHAKE TOKEN
 * Encapsulates the core identity profile parameters into a cryptographically sealed token.
 */
export async function signMeshToken(payload: MeshSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // Strict 8-hour session cycle before re-authentication requirement
    .sign(secretKey);        // 🛠️ FIXED TS 2551: Realigned to correct signature method
}

/**
 * 🔓 VERIFY AND EXTRACT DECRYPTED STATE
 * Intercepts incoming session tokens, verifies signature validity, and catches expired parameters.
 */
export async function verifyMeshToken(token: string): Promise<MeshSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    
    return payload as unknown as MeshSessionPayload;
  } catch (error) {
    console.error("[MESH-SCAN] Cryptographic handshake rejected:", error);
    return null;
  }
}