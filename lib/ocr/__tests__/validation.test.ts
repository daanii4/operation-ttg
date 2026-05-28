/**
 * Sprint 6 / Workstream B — file validation tests.
 *
 * Pinned because the upload handler relies on these checks for security.
 * If a future change weakens them, CI fails before the regression ships.
 */

import {
  detectMimeFromMagicBytes,
  validateUploadedFile,
} from "../validation";
import { MAX_FILE_SIZE_BYTES } from "../types";

function bytes(...arr: number[]): Uint8Array {
  return new Uint8Array(arr);
}

describe("OCR validation", () => {
  describe("detectMimeFromMagicBytes", () => {
    it("recognizes PDF (%PDF)", () => {
      expect(detectMimeFromMagicBytes(bytes(0x25, 0x50, 0x44, 0x46))).toBe(
        "application/pdf"
      );
    });

    it("recognizes JPEG (FF D8 FF)", () => {
      expect(detectMimeFromMagicBytes(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe(
        "image/jpeg"
      );
    });

    it("recognizes PNG (8-byte signature)", () => {
      expect(
        detectMimeFromMagicBytes(
          bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
        )
      ).toBe("image/png");
    });

    it("recognizes WebP (RIFF + WEBP)", () => {
      expect(
        detectMimeFromMagicBytes(
          bytes(
            0x52, 0x49, 0x46, 0x46, // RIFF
            0x00, 0x00, 0x00, 0x00, // size
            0x57, 0x45, 0x42, 0x50, // WEBP
            0x00 // payload byte
          )
        )
      ).toBe("image/webp");
    });

    it("returns null for arbitrary binary", () => {
      expect(detectMimeFromMagicBytes(bytes(0x00, 0x01, 0x02, 0x03))).toBeNull();
    });

    it("rejects RIFF without WEBP marker", () => {
      // Looks like RIFF but missing WEBP at offset 8.
      expect(
        detectMimeFromMagicBytes(
          bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20)
        )
      ).toBeNull();
    });
  });

  describe("validateUploadedFile", () => {
    it("rejects unsupported Content-Type", () => {
      const result = validateUploadedFile("application/zip", bytes(0x50, 0x4b));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UNSUPPORTED_TYPE");
      }
    });

    it("rejects files larger than 10 MB", () => {
      const oversize = new Uint8Array(MAX_FILE_SIZE_BYTES + 1);
      // Fill the magic bytes so the size check triggers before bytes check.
      oversize.set([0x25, 0x50, 0x44, 0x46], 0);
      const result = validateUploadedFile("application/pdf", oversize);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FILE_TOO_LARGE");
      }
    });

    it("rejects spoofed Content-Type vs magic bytes", () => {
      // Caller claims PDF but bytes are JPEG.
      const result = validateUploadedFile(
        "application/pdf",
        bytes(0xff, 0xd8, 0xff, 0xe0)
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MAGIC_BYTES_MISMATCH");
      }
    });

    it("accepts a clean PDF upload", () => {
      const result = validateUploadedFile(
        "application/pdf",
        bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37) // %PDF-1.7
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.mime).toBe("application/pdf");
      }
    });

    it("accepts a clean JPEG upload", () => {
      const result = validateUploadedFile(
        "image/jpeg",
        bytes(0xff, 0xd8, 0xff, 0xe0)
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.mime).toBe("image/jpeg");
    });
  });
});
