import crypto from "crypto";

const DEFAULT_HMAC_SECRET =
  process.env.MESH_HMAC_SECRET ||
  process.env.PI_API_KEY ||
  process.env.OPERATOR_STELLAR_SECRET ||
  process.env.STELLAR_VAULT_SEED ||
  "mesh_default_hmac_secret_fallback_key";

/**
 * Generate an HMAC-SHA256 signature for string or object payloads
 */
export function generateMeshHmac(
  payload: any,
  secret: string = DEFAULT_HMAC_SECRET
): string {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify an HMAC-SHA256 signature using timing-safe buffer comparison
 */
export function verifyMeshHmac(
  payload: any,
  providedSignature: string,
  secret: string = DEFAULT_HMAC_SECRET
): boolean {
  if (!providedSignature || typeof providedSignature !== "string") {
    return false;
  }

  try {
    const expectedSignature = generateMeshHmac(payload, secret);
    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const providedBuf = Buffer.from(providedSignature, "utf-8");

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (err) {
    console.error("[HMAC_VERIFY_ERROR]:", err);
    return false;
  }
}

export default {
  generateMeshHmac,
  verifyMeshHmac,
};