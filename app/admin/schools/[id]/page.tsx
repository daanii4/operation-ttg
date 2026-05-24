import Breadcrumb from "@/components/layout/Breadcrumb";
import { prismaTtg } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SchoolClassificationManager from "./SchoolClassificationManager";

export const dynamic = "force-dynamic";

export default async function AdminSchoolPage({
  params,
}: {
  params: { id: string };
}) {
  const school = await prismaTtg.highSchool.findUnique({
    where: { id: params.id },
    include: {
      classifications: {
        orderBy: [{ academicYear: "desc" }, { courseNameDisplay: "asc" }],
        take: 500,
      },
    },
  });

  if (!school) notFound();

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/dashboard/analytics" },
          { label: "Admin", href: "/admin/districts/new" },
          { label: school.schoolName },
        ]}
      />
      <SchoolClassificationManager
        schoolId={school.id}
        schoolName={school.schoolName}
        initialClassifications={school.classifications.map((c) => ({
          id: c.id,
          courseNameDisplay: c.courseNameDisplay,
          academicYear: c.academicYear,
          ncaaD1Category: c.ncaaD1Category,
          agCategory: c.agCategory,
          countsGeometryForNcaa: c.countsGeometryForNcaa,
          countsGeometryForAg: c.countsGeometryForAg,
          countsLabForAg: c.countsLabForAg,
        }))}
      />
    </>
  );
}
