/**
 * Computes deterministic SHA-256 checksums in browser using Web Crypto API
 */
export async function computeSHA256(input: string | ArrayBuffer): Promise<string> {
  const encoder = new TextEncoder();
  const data = typeof input === "string" ? encoder.encode(input) : input;
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function hashUploadedFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return computeSHA256(arrayBuffer);
}
