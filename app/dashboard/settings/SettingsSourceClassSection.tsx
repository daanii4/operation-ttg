import { SettingsCard, SettingsSectionHeader } from "@/lib/settings/settings-ui";

const CLASSES = [
  {
    label: "Class A",
    chipClass: "border-[var(--status-track)] bg-[var(--status-track-tint)] text-[var(--status-track)]",
    description: "District official transcript (SIS export, signed PDF).",
  },
  {
    label: "Class B",
    chipClass: "border-[var(--olive-600)] bg-[var(--olive-100)] text-[var(--olive-800)]",
    description: "District classification / catalog reference or OCR transcript.",
  },
  {
    label: "Class C",
    chipClass:
      "border-[var(--status-support)] bg-[var(--status-support-tint)] text-[var(--status-support)]",
    description: "Advisor-entered observation or student self-report (provisional).",
  },
  {
    label: "Class D",
    chipClass: "border-[var(--border-default)] bg-[var(--surface-inner)] text-[var(--text-tertiary)]",
    description: "Inferred / imputed — placeholder display only.",
  },
] as const;

export function SettingsSourceClassSection() {
  return (
    <SettingsCard>
      <SettingsSectionHeader
        title="Data source class reference"
        subtitle="Operation TTG records the provenance of every grade and signal."
      />
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {CLASSES.map((c) => (
          <div
            key={c.label}
            className="rounded-md border border-[var(--border-default)] bg-[var(--surface-inner)] p-3"
          >
            <dt>
              <span
                className={[
                  "inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold",
                  c.chipClass,
                ].join(" ")}
              >
                {c.label}
              </span>
            </dt>
            <dd className="mt-2 font-sans text-[12px] leading-4 text-[var(--text-secondary)]">
              {c.description}
            </dd>
          </div>
        ))}
      </dl>
    </SettingsCard>
  );
}

export default SettingsSourceClassSection;
