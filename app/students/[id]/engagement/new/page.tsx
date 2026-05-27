import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { getTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";
import { computeAllDemoResults } from "@/lib/seed/demo-data";
import EngagementForm from "./engagement-form";

export default async function NewEngagementPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") {
    redirect(`/login?redirectTo=${encodeURIComponent(`/students/${params.id}/engagement/new`)}`);
  }

  const dbStudent = await prismaTtg.studentAthlete.findUnique({
    where: { id: params.id },
    select: { firstName: true, lastName: true },
  });
  const demoStudent = computeAllDemoResults().find((row) => row.studentId === params.id);
  const firstName = dbStudent?.firstName ?? demoStudent?.firstName ?? "Student";
  const lastName = dbStudent?.lastName ?? demoStudent?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <DashboardShell omitAppHeader pageTitle="Add engagement observation">
      <Breadcrumb
        items={[
          { label: "Cohort Dashboard", href: "/dashboard/analytics" },
          { label: fullName, href: `/students/${params.id}` },
          { label: "Add engagement observation" },
        ]}
      />
      <div className="mt-6 max-w-2xl">
        <EngagementForm studentId={params.id} />
      </div>
    </DashboardShell>
  );
}
