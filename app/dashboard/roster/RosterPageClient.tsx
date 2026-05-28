"use client";

/**
 * Roster page client — Scholars OS layout pattern.
 *
 * Filters sit on the page surface (search pill + chips + bottom rule).
 * The roster table lives in a single Card, not separate boxed panels.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Sliders, Users, X } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { RosterFilters } from "./_components/RosterFilters";
import { RosterTable } from "./_components/RosterTable";
import { RosterCardList } from "./_components/RosterCardList";
import { RosterFilterSheet } from "./_components/RosterFilterSheet";
import {
  StudentIntakeModal,
  type IntakeSchoolOption,
} from "./_components/StudentIntakeModal";
import { useRosterFilters } from "./_components/use-roster-filters";

const PAGE_SIZE = 50;

export interface RosterPageClientProps {
  rows: QnRosterRow[];
  canCreateStudents: boolean;
  schools: IntakeSchoolOption[];
}

export default function RosterPageClient({
  rows,
  canCreateStudents,
  schools,
}: RosterPageClientProps) {
  const router = useRouter();
  const filters = useRosterFilters(rows);
  const [intakeOpen, setIntakeOpen] = React.useState(false);

  const addStudentButton = canCreateStudents ? (
    <Button variant="gold" icon={Plus} onClick={() => setIntakeOpen(true)}>
      Add student
    </Button>
  ) : null;

  const onStudentCreated = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const [page, setPage] = React.useState(1);
  React.useEffect(() => {
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

  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <>
      {/* ===================== Desktop (≥768px) ===================== */}
      <div className="hidden md:block">
        <RosterFilters
          filters={filters}
          totalCount={rows.length}
          filteredCount={total}
          addStudentAction={addStudentButton}
        />

        <Card variant="default" padding="none" radius="lg" className="overflow-hidden">
          <div className="border-b border-[var(--border-default)] px-5 py-4 md:px-6">
            <h2 className="font-serif text-[20px] leading-[1.25] text-[var(--text-primary)]">
              Student roster
            </h2>
          </div>

          {pageRows.length === 0 ? (
            filters.activeFilterCount === 0 && rows.length === 0 ? (
              <RosterEmpty
                canCreateStudents={canCreateStudents}
                onAddStudent={() => setIntakeOpen(true)}
              />
            ) : (
              <RosterEmptyFiltered onClear={filters.clearAll} />
            )
          ) : (
            <RosterTable rows={pageRows} />
          )}
        </Card>

        <div className="mt-4 flex items-center justify-between font-sans text-[12px] text-[var(--text-tertiary)]">
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
      <div className="md:hidden -mx-4 sm:-mx-6">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3">
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
                  className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--olive-600)] px-1 text-[11px] font-semibold text-white"
                  style={{ height: 18 }}
                >
                  {filters.activeFilterCount}
                </span>
              ) : null}
            </span>
          </Button>
        </div>

        <div className="px-4 pt-4">
          <RosterFilters
            filters={filters}
            totalCount={rows.length}
            filteredCount={total}
            addStudentAction={addStudentButton}
          />
        </div>

        {filters.activeChips.length > 0 ? (
          <div
            className="qn-no-scrollbar flex gap-2 overflow-x-auto border-b border-[var(--border-default)] px-4 py-2"
          >
            {filters.activeChips.map((chip) => (
              <button
                key={`${chip.kind}:${chip.value}`}
                type="button"
                onClick={() =>
                  filters.removeFilter(chip.kind as never, chip.value as never)
                }
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1.5 font-sans text-[12px] text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
                aria-label={`Remove filter ${chip.label}`}
              >
                {chip.label}
                <X size={12} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}

        <div className="px-4 pt-4">
          <Card variant="default" padding="none" radius="lg" className="overflow-hidden">
            {pageRows.length === 0 ? (
              filters.activeFilterCount === 0 && rows.length === 0 ? (
                <RosterEmpty
                  mobile
                  canCreateStudents={canCreateStudents}
                  onAddStudent={() => setIntakeOpen(true)}
                />
              ) : (
                <RosterEmptyFiltered onClear={filters.clearAll} mobile />
              )
            ) : (
              <RosterCardList rows={pageRows} />
            )}
          </Card>
        </div>

        {showPager ? (
          <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-3 font-sans text-[12px] text-[var(--text-tertiary)]">
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
          <p className="py-4 text-center font-sans text-[12px] text-[var(--text-tertiary)]">
            End of roster
          </p>
        ) : null}

        <RosterFilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filters={filters}
        />

        {canCreateStudents ? (
          <button
            type="button"
            className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border-0 bg-[var(--gold-500)] text-[22px] font-medium leading-none text-[#1e2b12] shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)] md:hidden"
            onClick={() => setIntakeOpen(true)}
            aria-label="Add student"
          >
            <Plus size={24} aria-hidden />
          </button>
        ) : null}
      </div>

      {canCreateStudents ? (
        <StudentIntakeModal
          open={intakeOpen}
          onClose={() => setIntakeOpen(false)}
          schools={schools}
          onCreated={onStudentCreated}
        />
      ) : null}
    </>
  );
}

function RosterEmpty({
  mobile = false,
  canCreateStudents = false,
  onAddStudent,
}: {
  mobile?: boolean;
  canCreateStudents?: boolean;
  onAddStudent?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{ paddingTop: mobile ? 32 : 48, paddingBottom: mobile ? 32 : 48 }}
      role="status"
    >
      <Users size={40} aria-hidden className="text-[var(--text-quaternary)]" />
      <p className="mt-4 font-sans text-[16px] font-semibold leading-6 text-[var(--text-primary)]">
        No students yet
      </p>
      <p className="mt-1 max-w-xs font-sans text-[13px] leading-5 text-[var(--text-tertiary)]">
        Add a student to start tracking their eligibility.
      </p>
      {canCreateStudents && onAddStudent ? (
        <div className="mt-4">
          <Button variant="gold" icon={Plus} onClick={onAddStudent}>
            Add student
          </Button>
        </div>
      ) : null}
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
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{ paddingTop: mobile ? 32 : 48, paddingBottom: mobile ? 32 : 48 }}
      role="status"
    >
      <Users size={40} aria-hidden className="text-[var(--text-quaternary)]" />
      <p className="mt-4 font-sans text-[16px] font-semibold leading-6 text-[var(--text-primary)]">
        No students match your filters
      </p>
      <p className="mt-1 max-w-sm font-sans text-[13px] leading-5 text-[var(--text-tertiary)]">
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
