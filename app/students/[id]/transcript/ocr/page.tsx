import { redirect } from "next/navigation";
import { getTtgSession } from "@/lib/auth/session";
import { getAdvisorDisplay } from "@/lib/auth/advisor-identity";
import { prismaTtg } from "@/lib/prisma";
import { computeAllDemoResults } from "@/lib/seed/demo-data";
import QnShell from "@/components/layout/qn/QnShell";
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

  const advisor = await getAdvisorDisplay();

  return (
    <QnShell
      pageTitle="Upload transcript"
      eyebrow={fullName.toUpperCase()}
      advisor={advisor}
    >
      <div
        style={{
          maxWidth: 880,
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 24,
          paddingBottom: 28,
        }}
      >
        <OcrUploadClient studentId={params.id} studentName={fullName} />
      </div>
    </QnShell>
  );
}
