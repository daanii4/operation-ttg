import Link from "next/link";
import { PermissionNotice, SettingsCard, SettingsSectionHeader } from "@/lib/settings/settings-ui";

export function SettingsDistrictsSection({ isAdmin }: { isAdmin: boolean }) {
  return (
    <SettingsCard>
      <SettingsSectionHeader
        title="Districts & schools"
        subtitle="Provision districts, register CEEB codes, and import course catalogs."
      />
      {isAdmin ? (
        <div className="mt-4">
          <Link
            href="/admin/districts/new"
            className="inline-flex min-h-[44px] items-center rounded-md bg-[var(--olive-700)] px-4 py-2 font-sans text-[12px] font-semibold text-white hover:bg-[var(--olive-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
          >
            Add district
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <PermissionNotice>
            Admin role required to manage districts and schools. Contact your program owner if you
            need access.
          </PermissionNotice>
        </div>
      )}
    </SettingsCard>
  );
}

export default SettingsDistrictsSection;
