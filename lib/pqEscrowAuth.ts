import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32_REV: Record<string, number> = Object.fromEntries(
  [...BASE32_ALPHABET].map((ch, idx) => [ch, idx])
);

const MAX_SOROBAN_SYMBOL_BYTES = 32;
export const ML_DSA_65_PUBLIC_KEY_BYTES = 1952;
export const ML_DSA_65_SIGNATURE_BYTES = 3309;

function decodeBase32(str: string): Buffer {
  const clean = str.trim().toUpperCase().replace(/=+$/, "");
  if (!clean) {
    throw new Error("Base32 input cannot be empty");
  }

  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const ch of clean) {
    const v = BASE32_REV[ch];
    if (v === undefined) {
      throw new Error(`Invalid base32 character: ${ch}`);
    }
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function crc16Ccitt(buf: Buffer): number {
  let crc = 0x0000;
  for (const byte of buf) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc;
}

function decodeContractId(contractAddress: string): Buffer {
  const raw = decodeBase32(contractAddress);
  if (raw.length < 3) {
    throw new Error("Invalid contract address length");
  }
  const payload = raw.subarray(0, raw.length - 2);
  const checksum = raw.readUInt16LE(raw.length - 2);
  if (crc16Ccitt(payload) !== checksum) {
    throw new Error(`Invalid contract address CRC16 checksum for ${contractAddress}`);
  }
  if (payload[0] !== (2 << 3)) {
    throw new Error(`Expected contract ('C') StrKey version byte, got ${payload[0]}`);
  }
  const hash32 = payload.subarray(1);
  if (hash32.length !== 32) {
    throw new Error(`Expected 32-byte contract hash, got ${hash32.length}`);
  }
  return hash32;
}

/**
 * XDR encoding for Soroban `Address::Contract(hash32)` -> `ScVal::Address(ScAddress::Contract(hash32))`
 * 4B SCV_ADDRESS (18) + 4B SC_ADDRESS_TYPE_CONTRACT (1) + 32B contract hash = 40 bytes.
 */
export function encodeContractAddressXdr(contractAddress: string): Buffer {
  const hash32 = decodeContractId(contractAddress);
  const buf = Buffer.alloc(4 + 4 + 32);
  buf.writeUInt32BE(18, 0);
  buf.writeUInt32BE(1, 4);
  hash32.copy(buf, 8);
  return buf;
}

/**
 * XDR encoding for Soroban `Symbol` -> `ScVal::Symbol(ScSymbol(bytes))`
 * 4B SCV_SYMBOL (15) + 4B byte length + UTF-8 bytes + zero-padding to 4-byte boundary.
 */
export function encodeSymbolXdr(symbolText: string): Buffer {
  const trimmed = symbolText.trim();
  if (!trimmed) {
    throw new Error("Soroban Symbol cannot be empty");
  }
  const strBuf = Buffer.from(trimmed, "utf8");
  if (strBuf.length > MAX_SOROBAN_SYMBOL_BYTES) {
    throw new Error(
      `Soroban Symbol "${trimmed}" exceeds ${MAX_SOROBAN_SYMBOL_BYTES} bytes (${strBuf.length})`
    );
  }
  const padLen = (4 - (strBuf.length % 4)) % 4;
  const buf = Buffer.alloc(4 + 4 + strBuf.length + padLen);
  buf.writeUInt32BE(15, 0);
  buf.writeUInt32BE(strBuf.length, 4);
  strBuf.copy(buf, 8);
  return buf;
}

export function i128ToBigEndianBytes(value: bigint | number | string): Buffer {
  const buf = Buffer.alloc(16);
  let v = BigInt.asIntN(128, BigInt(value));
  if (v < 0n) {
    v += 1n << 128n;
  }
  for (let i = 15; i >= 0; i--) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}

export function u64ToBigEndianBytes(value: bigint | number | string): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt.asUintN(64, BigInt(value)), 0);
  return buf;
}

export interface EscrowAuthPayloadParams {
  contractId: string;
  action?: string;
  escrowId: string;
  amount: bigint | number | string;
  nonce: bigint | number | string;
}

/**
 * Mirrors `build_escrow_auth_payload` in `bazaar-vault/src/lib.rs`:
 * contract_xdr (40B) || action_symbol_xdr || escrow_id_symbol_xdr || amount_i128_be (16B) || nonce_u64_be (8B)
 */
export function buildEscrowAuthPayload(params: EscrowAuthPayloadParams): Buffer {
  const {
    contractId,
    action = "RESOLVE",
    escrowId,
    amount,
    nonce,
  } = params;

  return Buffer.concat([
    encodeContractAddressXdr(contractId),
    encodeSymbolXdr(action),
    encodeSymbolXdr(escrowId),
    i128ToBigEndianBytes(amount),
    u64ToBigEndianBytes(nonce),
  ]);
}

export function verifyEscrowAuthWithMlDsa65(
  params: EscrowAuthPayloadParams,
  signature: Uint8Array | Buffer,
  publicKey: Uint8Array | Buffer
): boolean {
  const payload = buildEscrowAuthPayload(params);
  const message = new Uint8Array(payload);
  const sigBytes = new Uint8Array(signature);
  const pubBytes = new Uint8Array(publicKey);

  if (
    pubBytes.length !== ML_DSA_65_PUBLIC_KEY_BYTES ||
    sigBytes.length !== ML_DSA_65_SIGNATURE_BYTES
  ) {
    return false;
  }

  return ml_dsa65.verify(sigBytes, message, pubBytes);
}

export interface SignedPqDisputeAuth {
  payload: Buffer;
  payloadHex: string;
  pqPublicKey: Buffer;
  pqPublicKeyHex: string;
  pqSignature: Buffer;
  pqSignatureHex: string;
  pqSecretKey: Uint8Array;
  zeroizeSecretKey: () => void;
}

/**
 * Signs the escrow authorization payload with ML-DSA-65 (FIPS 204) and verifies locally.
 * Optionally accepts a 32-byte `seed` for deterministic/test key generation.
 */
export function signEscrowAuthWithMlDsa65(
  params: EscrowAuthPayloadParams,
  seed?: Uint8Array
): SignedPqDisputeAuth {
  if (seed !== undefined && seed.length !== 32) {
    throw new Error(`ML-DSA-65 seed must be exactly 32 bytes, got ${seed.length}`);
  }

  const payload = buildEscrowAuthPayload(params);
  const message = new Uint8Array(payload);

  const keys = seed ? ml_dsa65.keygen(seed) : ml_dsa65.keygen();
  const sig = ml_dsa65.sign(message, keys.secretKey);

  if (!ml_dsa65.verify(sig, message, keys.publicKey)) {
    throw new Error("ML-DSA-65 local signature self-verification failed");
  }

  const pqPublicKey = Buffer.from(keys.publicKey);
  const pqSignature = Buffer.from(sig);

  if (
    pqPublicKey.length !== ML_DSA_65_PUBLIC_KEY_BYTES ||
    pqSignature.length !== ML_DSA_65_SIGNATURE_BYTES
  ) {
    throw new Error(
      `Unexpected ML-DSA-65 lengths: pub=${pqPublicKey.length} (expected ${ML_DSA_65_PUBLIC_KEY_BYTES}), sig=${pqSignature.length} (expected ${ML_DSA_65_SIGNATURE_BYTES})`
    );
  }

  const pqSecretKey = new Uint8Array(keys.secretKey);

  return {
    payload,
    payloadHex: payload.toString("hex"),
    pqPublicKey,
    pqPublicKeyHex: pqPublicKey.toString("hex"),
    pqSignature,
    pqSignatureHex: pqSignature.toString("hex"),
    pqSecretKey,
    zeroizeSecretKey: () => {
      pqSecretKey.fill(0);
      keys.secretKey.fill(0);
    },
  };
}