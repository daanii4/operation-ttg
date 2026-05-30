"use client";

import type { ConcernTag } from "@/lib/roster/concern-tags";

type Props = {
  tags: ConcernTag[];
  max?: number;
  className?: string;
};

/**
 * Renders structured concern tags (replaces free-text primaryConcern).
 */
export function ConcernTagList({ tags, max = 3, className }: Props) {
  if (tags.length === 0) return null;

  const visible = tags.slice(0, max);
  const rest = tags.length - visible.length;

  return (
    <ul
      className={["flex flex-wrap gap-1.5", className].filter(Boolean).join(" ")}
      aria-label="Primary concerns"
    >
      {visible.map((tag) => (
        <li key={tag.id}>
          <span className="inline-flex rounded-sm border border-[color:var(--border-default)] bg-surface-inner px-1.5 py-0.5 font-sans text-[10px] font-medium leading-tight text-text-secondary">
            {tag.label}
          </span>
        </li>
      ))}
      {rest > 0 ? (
        <li>
          <span className="font-sans text-[10px] text-text-tertiary">+{rest} more</span>
        </li>
      ) : null}
    </ul>
  );
}

export default ConcernTagList;
