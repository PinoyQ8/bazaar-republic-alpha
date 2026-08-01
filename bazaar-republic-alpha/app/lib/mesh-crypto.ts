import crypto from 'crypto';

/**
 * 🛡️ MESH PROTOCOL: Migration Hash Generator
 * Generates a 256-bit cryptographic hex string (64 characters).
 * This acts as the decentralized Bridge Key if a Pioneer is banned by PCT.
 */
export function generateMigrationHash(): string {
  const entropy = crypto.randomBytes(32).toString('hex');
  // Prefixing for easy identification in logs/UI
  return `bzr_hash_${entropy}`;
}