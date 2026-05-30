import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";
import { loadStudentProfile } from "@/lib/students/load-student-profile";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import StudentProfileClient from "./StudentProfileClient";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await prismaTtg.studentAthlete
    .findUnique({
      where: { id: params.id },
      select: { firstName: true, lastName: true },
    })
    .catch(() => null);
  if (!row) {
    return { title: "Student · Operation TTG" };
  }
  return {
    title: `${row.firstName} ${row.lastName} · Operation TTG`,
  };
}

export default async function StudentProfilePage({ params }: Props) {
  const session = await getTtgSession();
  if (!session) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/students/${params.id}`)}`);
  }

  const result = await loadStudentProfile(params.id, session);
  if (result.kind === "redirect") {
    redirect(`/login?redirectTo=${encodeURIComponent(`/students/${params.id}`)}`);
  }
  if (result.kind === "notFound") {
    notFound();
  }

  const { student, eligibility, teamRole, sessionUserId } = result;
  const fullName = `${student.firstName} ${student.lastName}`;

  return (
    <DashboardShell
      eyebrow="STUDENT"
      pageTitle={fullName}
      pageSubtitle={`${student.highSchoolName}${student.districtName ? ` · ${student.districtName}` : ""}`}
      hideHeaderTitle
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Roster", href: "/dashboard/roster" },
          { label: fullName },
        ]}
      />
      <StudentProfileClient
        student={student}
        eligibility={eligibility}
        teamRole={teamRole}
        sessionUserId={sessionUserId}
      />
    </DashboardShell>
  );
}
