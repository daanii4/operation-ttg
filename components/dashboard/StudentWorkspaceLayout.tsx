"use client";

/**
 * Scholars OS pattern — one Card shell: student list + detail pane.
 * Avoids stacked white cutoffs on the page background.
 */

import * as React from "react";
import Card from "@/components/ui/Card";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { StudentWorkspaceList } from "./StudentWorkspaceList";

export interface StudentWorkspaceLayoutProps {
  rows: QnRosterRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  listTitle?: string;
  hideBand?: boolean;
  listAriaLabel?: string;
  children: React.ReactNode;
}

export function StudentWorkspaceLayout({
  rows,
  selectedId,
  onSelect,
  listTitle,
  hideBand,
  listAriaLabel,
  children,
}: StudentWorkspaceLayoutProps) {
  return (
    <Card
      variant="default"
      padding="none"
      radius="lg"
      className="hidden min-h-[min(640px,calc(100vh-140px))] overflow-hidden md:flex"
    >
      <StudentWorkspaceList
        rows={rows}
        selectedId={selectedId}
        onSelect={onSelect}
        title={listTitle}
        hideBand={hideBand}
        ariaLabel={listAriaLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--surface-card)]">
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </Card>
  );
}

export default StudentWorkspaceLayout;
