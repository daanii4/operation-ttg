/**
 * Manteca USD — District + HighSchool seed (D2 §5.1).
 * Does NOT create CourseClassification rows — use paste-and-parse importer.
 */
import { prismaTtg } from "@/lib/prisma";

const DISTRICT_ID = "district_manteca_usd";

const STARTER_ALIASES: Record<string, string> = {
  "english ii": "english 2",
  "english iii": "english 3",
  "english iv": "english 4",
  bio: "biology",
  chem: "chemistry",
  "ap english": "english ap",
  "ap bio": "biology ap",
};

const SCHOOLS = [
  {
    id: "hs_manteca_high",
    schoolName: "Manteca High School",
    ceebCode: "051900", // Verified: NCAA HS Portal, May 2026
    city: "Manteca",
    seniorFallTermStart: new Date("2026-08-17"),
    summerTermEnd: new Date("2026-08-01"),
  },
  {
    id: "hs_east_union_high",
    schoolName: "East Union High School",
    ceebCode: "051899", // Verified: NCAA HS Portal, May 2026
    city: "Manteca",
    seniorFallTermStart: new Date("2026-08-17"),
    summerTermEnd: new Date("2026-08-01"),
  },
  {
    id: "hs_sierra_high",
    schoolName: "Sierra High School",
    ceebCode: "051903", // Verified: NCAA HS Portal, May 2026
    city: "Manteca",
    seniorFallTermStart: new Date("2026-08-17"),
    summerTermEnd: new Date("2026-08-01"),
  },
  {
    id: "hs_weston_ranch_high",
    schoolName: "Weston Ranch High School",
    ceebCode: "053839", // Verified: NCAA HS Portal, May 2026
    city: "Stockton",
    seniorFallTermStart: new Date("2026-08-17"),
    summerTermEnd: new Date("2026-08-01"),
  },
] as const;

export async function seedMantecaUsd(): Promise<{ districtId: string; schoolCount: number }> {
  await prismaTtg.district.upsert({
    where: { id: DISTRICT_ID },
    create: {
      id: DISTRICT_ID,
      districtName: "Manteca Unified School District",
      state: "CA",
      ucDistrictId: null,
      sourceUrl: "https://www.mantecausd.net/",
    },
    update: {
      districtName: "Manteca Unified School District",
      state: "CA",
    },
  });

  for (const school of SCHOOLS) {
    await prismaTtg.highSchool.upsert({
      where: { id: school.id },
      create: {
        id: school.id,
        districtId: DISTRICT_ID,
        schoolName: school.schoolName,
        ceebCode: school.ceebCode,
        city: school.city,
        state: "CA",
        seniorFallTermStart: school.seniorFallTermStart,
        summerTermEnd: school.summerTermEnd,
        maxCoresPerTerm: 4,
        maxEmsPerTerm: 2,
        calendarSourceUrl: "https://www.mantecausd.net/",
        courseNameAliases: STARTER_ALIASES,
      },
      update: {
        districtId: DISTRICT_ID,
        schoolName: school.schoolName,
        ceebCode: school.ceebCode,
        city: school.city,
        seniorFallTermStart: school.seniorFallTermStart,
        summerTermEnd: school.summerTermEnd,
        courseNameAliases: STARTER_ALIASES,
      },
    });
  }

  return { districtId: DISTRICT_ID, schoolCount: SCHOOLS.length };
}
