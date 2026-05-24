/**
 * Run: npx tsx scripts/seed-districts.ts
 * Requires DATABASE_URL and DIRECT_URL.
 */
import { seedMantecaUsd } from "../lib/seed/districts/manteca-usd";
import { seedTracyUsd } from "../lib/seed/districts/tracy-usd";

async function main() {
  const manteca = await seedMantecaUsd();
  const tracy = await seedTracyUsd();
  console.log("Manteca USD:", manteca);
  console.log("Tracy USD:", tracy);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prismaTtg } = await import("../lib/prisma");
    await prismaTtg.$disconnect();
  });
