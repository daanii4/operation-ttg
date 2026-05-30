"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchX, Sliders, Users, X } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { compareRosterUrgency } from "@/lib/roster/roster-sort";
import { RosterFilters } from "./_components/RosterFilters";
import { RosterTable } from "./_components/RosterTable";
import { RosterCardList } from "./_components/RosterCardList";
import { RosterFilterSheet } from "./_components/RosterFilterSheet";
import { RosterMobileSort, type MobileSortOption } from "./_components/RosterMobileSort";
import { sortRosterRowsForMobile } from "./_components/sort-roster-rows";
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
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [mobileSort, setMobileSort] = React.useState<MobileSortOption>("urgency");

  const sortedFiltered = React.useMemo(() => {
    const base = [...filters.filtered].sort(compareRosterUrgency);
    return base;
  }, [filters.filtered]);

  const mobileRows = React.useMemo(
    () => sortRosterRowsForMobile(filters.filtered, mobileSort),
    [filters.filtered, mobileSort]
  );

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
    filters.state.debouncedSearch,
    filters.state.bands,
    filters.state.agFlagged,
    filters.state.pastLock,
    filters.state.sport,
    filters.state.gradYear,
  ]);

  const total = sortedFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows =
    rows.length > PAGE_SIZE
      ? sortedFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
      : sortedFiltered;
  const showPager = total > PAGE_SIZE;

  const noData = rows.length === 0;
  const noMatch = !noData && total === 0;

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-0 px-4 pt-6 desktop:px-6">
      {/* Desktop */}
      <div className="hidden md:block">
        <RosterFilters
          filters={filters}
          filteredCount={total}
          addStudentAction={addStudentButton}
        />

        <Card variant="default" padding="none" radius="lg" className="overflow-hidden border border-[color:var(--border-default)] shadow-md">
          {noData ? (
            <RosterEmpty
              canCreateStudents={canCreateStudents}
              onAddStudent={() => setIntakeOpen(true)}
            />
          ) : noMatch ? (
            <RosterEmptyFiltered onClear={filters.clearAll} />
          ) : (
            <RosterTable rows={pageRows} />
          )}
        </Card>

        {showPager && !noData && !noMatch ? (
          <div className="mt-4 flex items-center justify-between font-sans text-[12px] text-text-tertiary">
            <p className="font-mono">
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, total)} of {total}
            </p>
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
          </div>
        ) : null}
      </div>

      {/* Mobile */}
      <div className="md:hidden -mx-4">
        <div className="flex items-center justify-between border-b border-[color:var(--border-default)] bg-surface-card px-4 py-3">
          <Button
            variant="outline"
            icon={Sliders}
            onClick={() => setSheetOpen(true)}
            aria-label={`Open filters${
              filters.activeFilterCount > 0 ? `, ${filters.activeFilterCount} active` : ""
            }`}
            className="min-h-[44px]"
          >
            Filter
            {filters.activeFilterCount > 0 ? (
              <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-olive-600 px-1 text-[11px] font-semibold text-white">
                {filters.activeFilterCount}
              </span>
            ) : null}
          </Button>
          {addStudentButton}
        </div>

        <RosterFilters filters={filters} filteredCount={total} mobile />

        <RosterMobileSort value={mobileSort} onChange={setMobileSort} />

        {filters.activeChips.length > 0 ? (
          <div className="qn-no-scrollbar flex gap-2 overflow-x-auto border-b border-[color:var(--border-default)] px-4 py-2">
            {filters.activeChips.map((chip) => (
              <button
                key={`${chip.kind}:${chip.value}`}
                type="button"
                onClick={() =>
                  filters.removeFilter(chip.kind as never, chip.value as never)
                }
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-full border border-[color:var(--border-default)] bg-surface-card px-2.5 py-1.5 font-sans text-[12px] text-text-primary"
              >
                {chip.label}
                <X size={12} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}

        {noData ? (
          <RosterEmpty
            mobile
            canCreateStudents={canCreateStudents}
            onAddStudent={() => setIntakeOpen(true)}
          />
        ) : noMatch ? (
          <RosterEmptyFiltered onClear={filters.clearAll} mobile />
        ) : (
          <RosterCardList rows={mobileRows} />
        )}

        <RosterFilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filters={filters}
        />
      </div>

      {canCreateStudents ? (
        <StudentIntakeModal
          open={intakeOpen}
          onClose={() => setIntakeOpen(false)}
          schools={schools}
          onCreated={onStudentCreated}
        />
      ) : null}
    </div>
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
      style={{ paddingTop: mobile ? 40 : 56, paddingBottom: mobile ? 40 : 56 }}
      role="status"
    >
      <Users size={32} aria-hidden className="text-text-tertiary" />
      <p className="mt-4 font-sans text-[14px] text-text-secondary">
        No student-athletes in this cohort yet
      </p>
      <p className="mt-1 max-w-sm font-sans text-[12px] text-text-tertiary">
        Add students from the Intake screen to begin tracking eligibility.
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
      style={{ paddingTop: mobile ? 40 : 56, paddingBottom: mobile ? 40 : 56 }}
      role="status"
    >
      <SearchX size={32} aria-hidden className="text-text-tertiary" />
      <p className="mt-4 font-sans text-[14px] text-text-secondary">No athletes match these filters</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 font-sans text-[13px] font-medium text-gold-600 underline [text-underline-offset:3px] hover:text-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
      >
        Clear filters
      </button>
    </div>
  );
}
