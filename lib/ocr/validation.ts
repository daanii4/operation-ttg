/**
 * Sprint 6 / Workstream B — file validation utilities.
 *
 * The upload handler defends against three classes of bad input:
 *   1. wrong / unset Content-Type        → reject with 400 + "Unsupported file type"
 *   2. file size > 10 MB                 → reject with 400 + "File too large"
 *   3. magic bytes don't match Content-Type → reject with 400 + "Spoofed file type"
 *
 * Why magic bytes? An attacker can flip the Content-Type header trivially.
 * Magic bytes are read from the raw payload itself, so a renamed `.exe`
 * uploaded as `image/png` fails this check even though headers are clean.
 */

import {
  ACCEPTED_MIME_TYPES,
  MAGIC_BYTE_SIGNATURES,
  MAX_FILE_SIZE_BYTES,
} from "./types";

export type FileValidationError =
  | { code: "UNSUPPORTED_TYPE"; message: string }
  | { code: "FILE_TOO_LARGE"; message: string }
  | { code: "MAGIC_BYTES_MISMATCH"; message: string };

export interface FileValidationOk {
  ok: true;
  mime: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
}

export type FileValidationResult =
  | FileValidationOk
  | { ok: false; error: FileValidationError };

export function validateUploadedFile(
  contentType: string | null | undefined,
  bytes: Uint8Array
): FileValidationResult {
  if (!contentType || !ACCEPTED_MIME_TYPES.has(contentType)) {
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED_TYPE",
        message:
          "Unsupported file type — accepted formats: PDF, JPEG, PNG, WebP.",
      },
    };
  }
  if (bytes.byteLength > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File too large — maximum ${
          MAX_FILE_SIZE_BYTES / 1024 / 1024
        }MB.`,
      },
    };
  }

  const detectedMime = detectMimeFromMagicBytes(bytes);
  if (detectedMime !== contentType) {
    return {
      ok: false,
      error: {
        code: "MAGIC_BYTES_MISMATCH",
        message:
          "File contents do not match the declared type. Re-export and try again.",
      },
    };
  }

  return { ok: true, mime: contentType as FileValidationOk["mime"] };
}

export function detectMimeFromMagicBytes(
  bytes: Uint8Array
): FileValidationOk["mime"] | null {
  for (const sig of MAGIC_BYTE_SIGNATURES) {
    if (bytes.byteLength < sig.prefix.length) continue;
    let match = true;
    for (let i = 0; i < sig.prefix.length; i++) {
      if (bytes[i] !== sig.prefix[i]) {
        match = false;
        break;
      }
    }
    if (!match) continue;

    if (sig.variant === "webp-riff") {
      // RIFF header at 0..3 + "WEBP" at 8..11.
      if (
        bytes.byteLength >= 12 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      ) {
        return "image/webp";
      }
      continue;
    }

    return sig.mime;
  }
  return null;
}
