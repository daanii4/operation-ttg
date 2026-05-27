import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import StudentProfileClient from "./StudentProfileClient";
import { computeAllDemoResults } from "@/lib/seed/demo-data";
import { getHolisticProfile } from "@/lib/seed/holistic-data";
import { attachOverallRisk } from "@/lib/calculations/holistic-rollup";
import { getTtgSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Student Profile · Operation TTG",
};

export default async function StudentProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getTtgSession();
  const allResults = computeAllDemoResults();
  const found = allResults.find((r) => r.studentId === params.id);

  if (!found) notFound();

  const serialized = {
    ...found,
    highSchoolId: found.highSchoolId,
    courses: found.courses.map((course) => ({
      id: course.id,
      courseName: course.courseName,
      ncaaD1Category: course.ncaaD1Category,
    })),
    f5: {
      ...found.f5,
      lockInDate: found.f5.lockInDate?.toISOString() ?? null,
      computedAt: found.f5.computedAt.toISOString(),
    },
    holistic: attachOverallRisk(
      getHolisticProfile(found.studentId),
      found.f5.applicable ? found.f5.riskBand : "NOT_APPLICABLE"
    ),
    isDemoStudent: true,
    sessionUserId: session?.userId ?? null,
  };

  const fullName = `${found.firstName} ${found.lastName}`;

  return (
    <DashboardShell omitAppHeader pageTitle={fullName}>
      <Breadcrumb
        items={[
          { label: "Cohort Dashboard", href: "/dashboard/analytics" },
          { label: fullName },
        ]}
      />
      <StudentProfileClient data={serialized} />
    </DashboardShell>
  );
}
