"use client";

import * as React from "react";
import { ExportPDFButton } from "./ExportPDFButton";

export interface ExportBarProps {
  studentId: string;
  studentName: string;
  filenameHint: string;
}

export function ExportBar({ studentId, studentName, filenameHint }: ExportBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-25 border-t border-[var(--border-default)] bg-[var(--surface-card)] px-6 py-3 md:left-auto"
      style={{
        boxShadow: "0 -4px 12px rgb(0 0 0 / 0.06)",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex max-w-[960px] justify-end">
        <ExportPDFButton
          variant="gold"
          fullWidth
          className="md:max-w-none md:w-auto min-h-[44px]"
          studentId={studentId}
          studentName={studentName}
          filenameHint={filenameHint}
        />
      </div>
    </div>
  );
}

export default ExportBar;
