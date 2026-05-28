/**
 * Sprint 7 / Workstream A-4 — AES-256-GCM payload encryption.
 *
 * Raw provider payloads can contain real PII (verified transcript records).
 * We encrypt them at rest in the `class_a_feed_jobs.raw_payload` column so
 * even a database dump leak doesn't expose plaintext. The wire format is:
 *
 *   [IV (12 bytes)][AUTH_TAG (16 bytes)][CIPHERTEXT (variable)]
 *
 * AES-GCM is authenticated; tampering with the ciphertext fails on
 * decryption rather than producing garbage. The 256-bit key is loaded
 * from `process.env.DATA_FEED_ENCRYPTION_KEY` (hex-encoded 64 chars) and
 * never logged.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_BYTES = 32;

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super(
      "DATA_FEED_ENCRYPTION_KEY is not configured. Class A ingestion " +
        "cannot run without a 32-byte (64 hex char) encryption key."
    );
    this.name = "MissingEncryptionKeyError";
  }
}

function loadKey(): Buffer {
  const hex = process.env.DATA_FEED_ENCRYPTION_KEY;
  if (!hex) throw new MissingEncryptionKeyError();
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== KEY_BYTES) {
    throw new Error(
      `DATA_FEED_ENCRYPTION_KEY must decode to exactly ${KEY_BYTES} bytes (${KEY_BYTES * 2} hex chars). Got ${buf.length}.`
    );
  }
  return buf;
}

/**
 * Encrypt a JSON-stringifiable payload. Returns the IV+tag+ciphertext blob
 * as a Uint8Array<ArrayBuffer> — Prisma's Bytes column requires the strict
 * ArrayBuffer flavor, so we copy the bytes into a fresh ArrayBuffer.
 */
export function encryptPayload(plaintextJson: string): Uint8Array<ArrayBuffer> {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintextJson, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, authTag, ciphertext]);
  // Re-allocate into an ArrayBuffer-typed Uint8Array. Same memory cost as
  // Buffer.concat result; satisfies the Prisma input typing.
  const ab = new ArrayBuffer(blob.byteLength);
  const out = new Uint8Array(ab);
  out.set(blob);
  return out;
}

/** Decrypt the IV+tag+ciphertext blob produced by `encryptPayload`. */
export function decryptPayload(blob: Uint8Array): string {
  const key = loadKey();
  const buf = Buffer.from(blob);
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Encrypted payload too short to contain IV + auth tag");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
