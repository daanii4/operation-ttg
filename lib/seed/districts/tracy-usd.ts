/**
 * Tracy USD — District + HighSchool seed (D2 §5.2).
 * School roster confirmed during D2 §5 intake — placeholder CEEB codes only.
 */
import { prismaTtg } from "@/lib/prisma";

const DISTRICT_ID = "district_tracy_usd";

const STARTER_ALIASES: Record<string, string> = {
  "english ii": "english 2",
  "english iii": "english 3",
  bio: "biology",
  chem: "chemistry",
};

/** Confirm exact roster against NCAA portal during §5 intake. */
const SCHOOLS = [
  {
    id: "hs_tracy_high",
    schoolName: "Tracy High School",
    ceebCode: "TODO_CEEB_tracy-high",
    city: "Tracy",
    seniorFallTermStart: new Date("2026-08-17"),
    summerTermEnd: new Date("2026-08-01"),
  },
  {
    id: "hs_west_high_tracy",
    schoolName: "West High School",
    ceebCode: "TODO_CEEB_west-high",
    city: "Tracy",
    seniorFallTermStart: new Date("2026-08-17"),
    summerTermEnd: new Date("2026-08-01"),
  },
  {
    id: "hs_merrill_f_west",
    schoolName: "Merrill F. West High School",
    ceebCode: "TODO_CEEB_merrill-f-west",
    city: "Tracy",
    seniorFallTermStart: new Date("2026-08-17"),
    summerTermEnd: new Date("2026-08-01"),
  },
  {
    id: "hs_kimball_high",
    schoolName: "Kimball High School",
    ceebCode: "TODO_CEEB_kimball-high",
    city: "Tracy",
    seniorFallTermStart: new Date("2026-08-17"),
    summerTermEnd: new Date("2026-08-01"),
  },
] as const;

export async function seedTracyUsd(): Promise<{ districtId: string; schoolCount: number }> {
  await prismaTtg.district.upsert({
    where: { id: DISTRICT_ID },
    create: {
      id: DISTRICT_ID,
      districtName: "Tracy Unified School District",
      state: "CA",
      ucDistrictId: null,
      sourceUrl: "https://www.tracy.k12.ca.us/",
    },
    update: {
      districtName: "Tracy Unified School District",
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
        calendarSourceUrl: "https://www.tracy.k12.ca.us/",
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
