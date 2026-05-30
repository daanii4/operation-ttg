"use client";

import Link from "next/link";
import { Button } from "@/components/ui/qn";
import type { ProfileCourse, ProfileStudent } from "../profile-types";

function sourceBadge(source: string) {
  switch (source) {
    case "A":
      return {
        label: "Verified",
        className:
          "border border-[var(--color-green)] bg-[var(--color-green-tint)] text-[var(--color-green)]",
      };
    case "B":
      return {
        label: "OCR",
        className:
          "border border-[var(--color-yellow)] bg-[var(--color-yellow-tint)] text-[var(--color-yellow)]",
      };
    default:
      return {
        label: "Manual",
        className: "border border-[var(--border-default)] bg-[var(--surface-inner)] text-[var(--text-tertiary)]",
      };
  }
}

export function ProfileTranscriptTab({
  student,
  canEdit,
}: {
  student: ProfileStudent;
  canEdit: boolean;
}) {
  const courses = [...student.courses].sort((a, b) => {
    const ay = b.academicYear ?? "";
    const ay2 = a.academicYear ?? "";
    if (ay !== ay2) return ay.localeCompare(ay2);
    return b.termEndDate.localeCompare(a.termEndDate);
  });

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-6 py-12 text-center">
        <p className="font-sans text-[14px] text-[var(--text-secondary)]">
          No course records yet. Add courses manually or upload a transcript.
        </p>
        {canEdit ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href={`/students/${student.id}/transcript/new`}>
              <Button variant="outline">Add course</Button>
            </Link>
            <Link href={`/students/${student.id}/transcript/ocr`}>
              <Button variant="gold">Upload transcript</Button>
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
      {canEdit ? (
        <div className="flex flex-wrap justify-end gap-2 border-b border-[var(--border-default)] px-4 py-3">
          <Link href={`/students/${student.id}/transcript/new`}>
            <Button variant="outline">Add course</Button>
          </Link>
          <Link href={`/students/${student.id}/transcript/ocr`}>
            <Button variant="gold">Upload transcript</Button>
          </Link>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-[var(--surface-inner)]">
            <tr>
              {["Course", "Grade", "Term", "Year", "Term length", "Source"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((course, idx) => {
              const badge = sourceBadge(course.dataSourceClass);
              return (
                <tr
                  key={course.id}
                  className={
                    idx % 2 === 1
                      ? "border-t border-[var(--border-default)] bg-[var(--surface-inner)]"
                      : "border-t border-[var(--border-default)]"
                  }
                >
                  <td className="px-4 py-3 font-sans text-[13px] text-[var(--text-primary)]">
                    {course.courseName}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px]">{course.gradeLetterNormalized}</td>
                  <td className="px-4 py-3 font-sans text-[13px] text-[var(--text-secondary)]">
                    {course.term ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-sans text-[13px] text-[var(--text-secondary)]">
                    {course.academicYear ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-sans text-[13px] capitalize text-[var(--text-secondary)]">
                    {course.termLength}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
