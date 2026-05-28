"use client";

/**
 * QuasarNova v1 — Roster page client orchestrator.
 *
 * Holds the filter state and routes between two render trees:
 *   • desktop ≥768px → RosterFilters + RosterTable + pagination
 *   • mobile  <768px → mobile search bar + active filter strip + RosterCardList
 *
 * Both trees consume the same useRosterFilters() hook so the desktop dropdowns
 * and the mobile bottom sheet stay in sync. We do not try to make one
 * component do both layouts (per spec §7).
 */

import * as React from "react";
import { Search, Sliders, Users, X } from "lucide-react";
import { Button, Input } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { RosterFilters } from "./_components/RosterFilters";
import { RosterTable } from "./_components/RosterTable";
import { RosterCardList } from "./_components/RosterCardList";
import { RosterFilterSheet } from "./_components/RosterFilterSheet";
import { useRosterFilters } from "./_components/use-roster-filters";

const PAGE_SIZE = 50;

export interface RosterPageClientProps {
  rows: QnRosterRow[];
}

export default function RosterPageClient({ rows }: RosterPageClientProps) {
  const filters = useRosterFilters(rows);

  const [page, setPage] = React.useState(1);
  React.useEffect(() => {
    // Any filter change resets pagination so the user doesn't land on an
    // empty page after narrowing the result set.
    setPage(1);
  }, [
    filters.state.search,
    filters.state.sport,
    filters.state.gradYear,
    filters.state.bands,
  ]);

  const total = filters.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows =
    rows.length > PAGE_SIZE
      ? filters.filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
      : filters.filtered;
  const showPager = total > PAGE_SIZE;

  // Mobile sheet state.
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <>
      {/* ===================== Desktop (≥768px) ===================== */}
      <div
        className="hidden md:block"
        style={{
          maxWidth: 1280,
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 0,
          paddingBottom: 28,
        }}
      >
        <RosterFilters filters={filters} />

        {pageRows.length === 0 ? (
          filters.activeFilterCount === 0 && rows.length === 0 ? (
            <RosterEmpty />
          ) : (
            <RosterEmptyFiltered onClear={filters.clearAll} />
          )
        ) : (
          <RosterTable rows={pageRows} />
        )}

        <div
          className="mt-4 flex items-center justify-between"
          style={{ fontSize: 12, color: "var(--color-muted)" }}
        >
          <p>
            {pageRows.length === 0
              ? "Showing 0 students"
              : showPager
                ? `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                    safePage * PAGE_SIZE,
                    total
                  )} of ${total}`
                : `Showing ${total} of ${rows.length} students`}
          </p>
          {showPager ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </Button>
              <Button
                variant="outline"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next ›
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ====================== Mobile (<768px) ====================== */}
      <div className="md:hidden">
        {/* Page title strip + filter button (§3.1). */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg)",
          }}
        >
          <h1
            className="font-serif"
            style={{ fontSize: 22, lineHeight: "28px", color: "var(--color-text)" }}
          >
            Roster
          </h1>
          <Button
            variant="outline"
            icon={Sliders}
            onClick={() => setSheetOpen(true)}
            aria-label={`Open filters${
              filters.activeFilterCount > 0 ? `, ${filters.activeFilterCount} active` : ""
            }`}
            style={{ height: 44 }}
          >
            <span className="inline-flex items-center gap-1.5">
              Filter
              {filters.activeFilterCount > 0 ? (
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center rounded-full"
                  style={{
                    minWidth: 18,
                    height: 18,
                    paddingLeft: 4,
                    paddingRight: 4,
                    background: "var(--color-green)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {filters.activeFilterCount}
                </span>
              ) : null}
            </span>
          </Button>
        </div>

        {/* Mobile search bar — pill input, 16px font, full width. */}
        <div
          style={{
            position: "sticky",
            top: 52, // top bar height
            zIndex: 15,
            background: "var(--color-bg)",
            borderBottom: "1px solid var(--color-border)",
            padding: "8px 16px",
          }}
        >
          <Input
            mobile
            pill
            icon={Search}
            placeholder="Search students"
            aria-label="Search roster"
            value={filters.state.search}
            onChange={(e) => filters.setSearch(e.target.value)}
          />
        </div>

        {/* Active filter strip. */}
        {filters.activeChips.length > 0 ? (
          <div
            className="qn-no-scrollbar"
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 16px",
              overflowX: "auto",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-bg)",
            }}
          >
            {filters.activeChips.map((chip) => (
              <button
                key={`${chip.kind}:${chip.value}`}
                type="button"
                onClick={() =>
                  filters.removeFilter(chip.kind as never, chip.value as never)
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-full border whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                style={{
                  padding: "6px 10px",
                  background: "white",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: 12,
                }}
                aria-label={`Remove filter ${chip.label}`}
              >
                {chip.label}
                <X size={12} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}

        {pageRows.length === 0 ? (
          filters.activeFilterCount === 0 && rows.length === 0 ? (
            <RosterEmpty mobile />
          ) : (
            <RosterEmptyFiltered onClear={filters.clearAll} mobile />
          )
        ) : (
          <RosterCardList rows={pageRows} />
        )}

        {showPager ? (
          <div
            className="flex items-center justify-between"
            style={{
              padding: "12px 16px",
              fontSize: 12,
              color: "var(--color-muted)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <span>
              {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </Button>
            </div>
          </div>
        ) : pageRows.length > 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: 16,
              fontSize: 12,
              color: "var(--color-muted)",
            }}
          >
            End of roster
          </p>
        ) : null}

        <RosterFilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filters={filters}
        />
      </div>
    </>
  );
}

function RosterEmpty({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: mobile ? 32 : 48,
        background: "var(--color-bg)",
      }}
      role="status"
    >
      <Users size={40} aria-hidden style={{ color: "#9CA3AF" }} />
      <p
        className="font-semibold"
        style={{ fontSize: 16, lineHeight: "24px", marginTop: 16, color: "var(--color-text)" }}
      >
        No students yet
      </p>
      <p
        style={{
          fontSize: 13,
          lineHeight: "20px",
          marginTop: 4,
          color: "var(--color-muted)",
          maxWidth: 320,
        }}
      >
        Add a student to start tracking their eligibility.
      </p>
    </div>
  );
}

function RosterEmptyFiltered({
  onClear,
  mobile = false,
}: {
  onClear: () => void;
  mobile?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: mobile ? 32 : 48,
        background: "var(--color-bg)",
      }}
      role="status"
    >
      <Users size={40} aria-hidden style={{ color: "#9CA3AF" }} />
      <p
        className="font-semibold"
        style={{ fontSize: 16, lineHeight: "24px", marginTop: 16, color: "var(--color-text)" }}
      >
        No students match your filters
      </p>
      <p
        style={{
          fontSize: 13,
          lineHeight: "20px",
          marginTop: 4,
          color: "var(--color-muted)",
          maxWidth: 360,
        }}
      >
        Try clearing one or more filters to widen results.
      </p>
      <div className="mt-4">
        <Button variant="ghost" onClick={onClear}>
          Clear all filters
        </Button>
      </div>
    </div>
  );
}
