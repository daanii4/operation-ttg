"use client";

/**
 * QuasarNova v1 — §3.3 mobile filter bottom sheet.
 *
 * Opens from the "Filter" button in the mobile page header. Slides up over a
 * darkened backdrop, hosts the same controls as the desktop filter bar, and
 * commits filters via the "Apply" primary button. "Clear all" wipes filters
 * without dismissing the sheet — matches expected mobile filter UX.
 */

import * as React from "react";
import { X } from "lucide-react";
import { Button, FilterChip, type Band } from "@/components/ui/qn";
import type { UseRosterFiltersResult } from "./use-roster-filters";

const BANDS: Band[] = ["GREEN", "YELLOW", "RED", "ESCALATED"];

export interface RosterFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: UseRosterFiltersResult;
}

export function RosterFilterSheet({ open, onClose, filters }: RosterFilterSheetProps) {
  // Close on Escape for keyboard parity with the close button.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden" role="dialog" aria-modal="true" aria-label="Filter roster">
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 60,
        }}
      />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "80vh",
          background: "var(--color-bg)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: "var(--shadow-sheet)",
          zIndex: 65,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          className="flex items-center justify-between"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
            Filter
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filter sheet"
            className="flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            style={{ color: "var(--color-muted)" }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto" style={{ padding: 16 }}>
          <Section title="Band">
            <div className="flex flex-wrap gap-2">
              {BANDS.map((b) => (
                <FilterChip
                  key={b}
                  band={b}
                  active={filters.state.bands.has(b)}
                  onToggle={() => filters.toggleBand(b)}
                  touch
                />
              ))}
            </div>
          </Section>

          <Section title="Sport">
            <RadioList
              name="sport"
              value={filters.state.sport}
              options={[
                { value: "ALL", label: "All sports" },
                ...filters.sports.map((s) => ({ value: s, label: s })),
              ]}
              onChange={filters.setSport}
            />
          </Section>

          <Section title="Grad year">
            <RadioList
              name="gradYear"
              value={filters.state.gradYear}
              options={[
                { value: "ALL", label: "All grad years" },
                ...filters.gradYears.map((y) => ({ value: String(y), label: String(y) })),
              ]}
              onChange={filters.setGradYear}
            />
          </Section>
        </div>

        <footer
          style={{
            padding: 16,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              filters.clearAll();
            }}
          >
            Clear all
          </Button>
          <Button variant="primary" fullWidth onClick={onClose} style={{ height: 48 }}>
            Apply
          </Button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--color-muted)",
          marginBottom: 12,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function RadioList({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <ul role="list" className="flex flex-col gap-1">
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <li key={opt.value}>
            <label
              className="flex w-full items-center gap-3 rounded-md transition-colors duration-[120ms] active:bg-[var(--color-row-alt)]"
              style={{
                minHeight: 44,
                paddingLeft: 12,
                paddingRight: 12,
                cursor: "pointer",
                color: "var(--color-text)",
              }}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="h-4 w-4 accent-[var(--color-green)]"
              />
              <span style={{ fontSize: 14 }}>{opt.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export default RosterFilterSheet;
