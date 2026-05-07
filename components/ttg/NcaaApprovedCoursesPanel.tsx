"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, ExternalLink, Printer } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  buildNcaaPortalDeepLink,
  getNcaaSchoolApprovedCourses,
  normalizeCourseName,
  type NcaaApprovedCourseCategory,
  type NcaaSchoolApprovedCourseSet,
} from "@/lib/seed/ncaa-approved-courses";

type StudentCourse = {
  id: string;
  courseName: string;
  ncaaD1Category: string | null;
};

type Props = {
  highSchoolId: string;
  highSchoolName: string;
  studentCourses: StudentCourse[];
};

const CATEGORY_ORDER: NcaaApprovedCourseCategory[] = [
  "English",
  "Mathematics",
  "Natural/Physical Science",
  "Social Science",
  "Additional Core Electives",
];

function categoryTitle(category: NcaaApprovedCourseCategory): string {
  if (category === "Additional Core Electives") {
    return "Foreign Language / Religion / Philosophy / Elective Cores";
  }
  return category;
}

function isStale(lastVerifiedDate: string): boolean {
  const last = new Date(lastVerifiedDate);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  return last < cutoff;
}

type CourseMapStatus = "approved" | "not_on_list" | "unverified";

function crossReference(
  schoolSet: NcaaSchoolApprovedCourseSet | null,
  studentCourseName: string
): CourseMapStatus {
  if (!schoolSet) return "unverified";
  const target = normalizeCourseName(studentCourseName);
  const approved = schoolSet.courses.some(
    (course) => normalizeCourseName(course.courseName) === target
  );
  return approved ? "approved" : "not_on_list";
}

export function NcaaApprovedCoursesPanel({
  highSchoolId,
  highSchoolName,
  studentCourses,
}: Props) {
  const schoolSet = getNcaaSchoolApprovedCourses(highSchoolId);
  const stale = schoolSet ? isStale(schoolSet.lastVerifiedDate) : true;
  const [open, setOpen] = React.useState(false);

  const deepLink = schoolSet
    ? buildNcaaPortalDeepLink(schoolSet.ceebCode)
    : "https://web3.ncaa.org/hsportal/exec/hsAction?hsActionSubmit=searchHighSchool";

  const grouped = React.useMemo(() => {
    if (!schoolSet)
      return new Map<
        NcaaApprovedCourseCategory,
        NcaaSchoolApprovedCourseSet["courses"]
      >();
    const map = new Map<
      NcaaApprovedCourseCategory,
      NcaaSchoolApprovedCourseSet["courses"]
    >();
    for (const category of CATEGORY_ORDER) {
      map.set(
        category,
        schoolSet.courses.filter((course) => course.category === category)
      );
    }
    return map;
  }, [schoolSet]);

  return (
    <>
      <Card variant="default" padding="lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
              NCAA Approved Courses
            </h2>
            <p className="mt-1 font-sans text-[12px] text-text-tertiary">
              Verify school clearance and map student courses to NCAA approved core lists.
            </p>
          </div>
          <Badge
            band={schoolSet?.schoolCleared ? "green" : "red"}
            icon={schoolSet?.schoolCleared ? CheckCircle : AlertTriangle}
          >
            {schoolSet?.schoolCleared
              ? "School NCAA Cleared"
              : "School Not Cleared"}
          </Badge>
        </div>

        {!schoolSet?.schoolCleared ? (
          <div className="mb-4 rounded border border-escalation/30 bg-escalation-fill px-4 py-3">
            <p className="font-sans text-[12px] font-semibold text-escalation">
              SCHOOL NOT CLEARED — no NCAA pathway exists until this is resolved.
            </p>
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded bg-surface-inner px-4 py-3">
          <div>
            <p className="font-sans text-[12px] font-semibold text-text-primary">
              {highSchoolName}
            </p>
            {schoolSet ? (
              <p className="font-sans text-[11px] text-text-secondary">
                {schoolSet.districtName}
              </p>
            ) : null}
            <p className="font-sans text-[11px] text-text-tertiary">
              eligibilitycenter.org · NCAA High School Portal
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-[var(--border-default)] bg-surface-card px-3 py-1.5 font-sans text-[12px] font-medium text-text-primary hover:bg-surface-inner"
            >
              View {highSchoolName} NCAA Approved Courses
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
              Open wall poster
            </Button>
          </div>
        </div>

        {stale ? (
          <div className="mb-4 rounded border border-band-support-border bg-band-support-fill px-4 py-3">
            <p className="font-sans text-[12px] text-band-support">
              This list may be outdated. Verify directly at eligibilitycenter.org.
            </p>
          </div>
        ) : null}

        <div className="rounded bg-surface-inner p-4">
          <h3 className="font-serif text-[16px] text-text-primary">
            Student Course Cross-Reference
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {studentCourses.map((course) => {
              const status = crossReference(schoolSet, course.courseName);
              return (
                <div
                  key={course.id}
                  className="flex items-center justify-between gap-3 rounded bg-surface-card px-3 py-2 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[12px] font-medium text-text-primary">
                      {course.courseName}
                    </p>
                    <p className="font-mono text-[10px] text-text-tertiary">
                      NCAA category: {course.ncaaD1Category ?? "unclassified"}
                    </p>
                  </div>
                  {status === "approved" ? (
                    <Badge band="green" icon={CheckCircle} size="sm">
                      NCAA Approved
                    </Badge>
                  ) : status === "not_on_list" ? (
                    <Badge band="yellow" icon={AlertTriangle} size="sm">
                      Not On List
                    </Badge>
                  ) : (
                    <Badge band="locked" icon={AlertTriangle} size="sm">
                      Unverified
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-6xl rounded-lg border border-[var(--border-default)] bg-surface-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-[22px] leading-tight text-text-primary">
                  {highSchoolName} — NCAA Approved Core Courses
                </h3>
                <p className="mt-1 font-sans text-[12px] text-text-tertiary">
                  NCAA Eligibility Center · Updated{" "}
                  {schoolSet ? new Date(schoolSet.lastVerifiedDate).toLocaleDateString("en-US") : "unverified"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print / Save as PDF
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            {stale ? (
              <div className="mb-4 rounded border border-band-support-border bg-band-support-fill px-4 py-3">
                <p className="font-sans text-[12px] text-band-support">
                  This list may be outdated. Verify directly at eligibilitycenter.org.
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CATEGORY_ORDER.map((category) => {
                const courses = grouped.get(category) ?? [];
                return (
                  <div key={category} className="rounded bg-surface-inner p-3">
                    <h4 className="font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
                      {categoryTitle(category)}
                    </h4>
                    <div className="mt-2 flex flex-col gap-2">
                      {courses.map((course) => (
                        <div key={course.courseName} className="rounded bg-surface-card px-3 py-2">
                          <p className="font-sans text-[12px] font-medium text-text-primary">
                            {course.courseName}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-text-tertiary">
                            {course.ncaaCategory} · 10/7 {course.countsTowardTenSeven ? "counts" : "not in first 7"} ·{" "}
                            {course.honorsEligible ? "honors eligible" : "standard"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-5 font-sans text-[11px] text-text-tertiary">
              Source: NCAA Eligibility Center High School Portal · ncaa3.org/hsportal · Verify annually
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default NcaaApprovedCoursesPanel;
