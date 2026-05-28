import type { CSSProperties } from "react";

export type WorkspaceSectionVariant = "card" | "embedded" | "embeddedCell";

/** Card chrome for standalone panels; flat sections inside StudentWorkspaceLayout. */
export function workspaceSectionShell(
  variant: WorkspaceSectionVariant = "card"
): CSSProperties {
  if (variant === "embedded") {
    return {
      padding: "20px 24px",
      borderBottom: "1px solid var(--border-default)",
      background: "transparent",
    };
  }
  if (variant === "embeddedCell") {
    return {
      padding: "20px 24px",
      background: "transparent",
    };
  }
  return {
    padding: 20,
    background: "var(--surface-card)",
    borderRadius: "var(--radius-default)",
    border: "1px solid var(--border-default)",
  };
}
