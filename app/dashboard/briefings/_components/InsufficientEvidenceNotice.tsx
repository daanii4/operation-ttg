"use client";

export function InsufficientEvidenceNotice() {
  return (
    <div
      role="status"
      className="mx-auto max-w-[960px] px-6"
      style={{ marginTop: 16 }}
    >
      <div
        className="rounded px-4 py-3 font-sans text-[12px] leading-4"
        style={{
          background: "var(--status-support-tint)",
          border: "1px solid var(--status-support)",
          color: "var(--status-support)",
        }}
      >
        Some layers don&apos;t have enough recent data. Treat values as provisional.
      </div>
    </div>
  );
}

export default InsufficientEvidenceNotice;
