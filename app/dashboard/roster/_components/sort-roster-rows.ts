import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { compareRosterUrgency } from "@/lib/roster/roster-sort";
import type { MobileSortOption } from "./RosterMobileSort";

export function sortRosterRowsForMobile(rows: QnRosterRow[], option: MobileSortOption): QnRosterRow[] {
  if (option === "urgency") return [...rows].sort(compareRosterUrgency);
  return [...rows].sort((a, b) => {
    switch (option) {
      case "name":
        return a.fullName.localeCompare(b.fullName);
      case "grad":
        return a.graduationYear - b.graduationYear;
      case "daysToLock": {
        const da = a.daysToLock ?? (a.riskBand === "LOCKED" ? -1 : Number.POSITIVE_INFINITY);
        const db = b.daysToLock ?? (b.riskBand === "LOCKED" ? -1 : Number.POSITIVE_INFINITY);
        return da - db;
      }
      default:
        return 0;
    }
  });
}
