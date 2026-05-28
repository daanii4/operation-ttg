import { redirect } from "next/navigation";
import { getTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";
import { computeAllDemoResults } from "@/lib/seed/demo-data";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import OcrUploadClient from "./OcrUploadClient";

export default async function OcrTranscriptPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") {
    redirect(
      `/login?redirectTo=${encodeURIComponent(
        `/students/${params.id}/transcript/ocr`
      )}`
    );
  }

  const dbStudent = await prismaTtg.studentAthlete
    .findUnique({
      where: { id: params.id },
      select: { firstName: true, lastName: true },
    })
    .catch(() => null);
  const demoStudent = computeAllDemoResults().find(
    (row) => row.studentId === params.id
  );

  const firstName = dbStudent?.firstName ?? demoStudent?.firstName ?? "Student";
  const lastName = dbStudent?.lastName ?? demoStudent?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <DashboardShell
      eyebrow={fullName.toUpperCase()}
      pageTitle="Upload transcript"
      pageSubtitle="OCR review · Class B data source"
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: fullName, href: `/students/${params.id}` },
          { label: "OCR upload" },
        ]}
      />
      <div
        style={{
          maxWidth: 880,
          marginLeft: "auto",
          marginRight: "auto",
          paddingTop: 8,
          paddingBottom: 28,
        }}
      >
        <OcrUploadClient studentId={params.id} studentName={fullName} />
      </div>
    </DashboardShell>
  );
}
