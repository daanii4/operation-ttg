/**
 * Sprint 7 / Workstream A — AES-GCM round-trip tests.
 *
 * Confirms encrypt/decrypt is symmetric and that tampering with the
 * ciphertext or auth tag fails fast (rather than producing garbled
 * plaintext that downstream consumers might still try to parse).
 */

import {
  MissingEncryptionKeyError,
  decryptPayload,
  encryptPayload,
} from "../encryption";

const VALID_KEY_HEX = "0".repeat(64); // 32 bytes of 0x00

describe("ingestion encryption", () => {
  const original = process.env.DATA_FEED_ENCRYPTION_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.DATA_FEED_ENCRYPTION_KEY;
    } else {
      process.env.DATA_FEED_ENCRYPTION_KEY = original;
    }
  });

  it("round-trips a JSON payload", () => {
    process.env.DATA_FEED_ENCRYPTION_KEY = VALID_KEY_HEX;
    const plaintext = JSON.stringify({ courses: [{ name: "English 11" }] });
    const blob = encryptPayload(plaintext);
    expect(decryptPayload(blob)).toBe(plaintext);
  });

  it("produces a different ciphertext each call (random IV)", () => {
    process.env.DATA_FEED_ENCRYPTION_KEY = VALID_KEY_HEX;
    const a = encryptPayload("hello");
    const b = encryptPayload("hello");
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it("rejects tampered ciphertext via the GCM auth tag", () => {
    process.env.DATA_FEED_ENCRYPTION_KEY = VALID_KEY_HEX;
    const blob = encryptPayload("important");
    // Flip a byte in the ciphertext region (after the 12-byte IV + 16-byte tag).
    blob[30] = blob[30]! ^ 0xff;
    expect(() => decryptPayload(blob)).toThrow();
  });

  it("throws MissingEncryptionKeyError when the env var is missing", () => {
    delete process.env.DATA_FEED_ENCRYPTION_KEY;
    expect(() => encryptPayload("anything")).toThrow(MissingEncryptionKeyError);
  });

  it("rejects keys that don't decode to 32 bytes", () => {
    process.env.DATA_FEED_ENCRYPTION_KEY = "abcd"; // 2 bytes
    expect(() => encryptPayload("anything")).toThrow();
  });
});
