/**
 * QuasarNova v1 — §1.7 Skeleton primitives
 *
 * Three building blocks:
 *   • <Skeleton />       — single shimmer block (width/height passed through).
 *   • <SkeletonRow />    — table row skeleton sized to match real roster rows.
 *   • <SkeletonCard />   — bordered card skeleton sized for the briefing card.
 *
 * Shimmer animation lives in `globals.css` (`qn-shimmer` keyframes / `qn-skeleton`
 * utility). Keeping it in CSS avoids a Tailwind plugin and stays usable from
 * server components.
 */

import * as React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  width?: number | string;
  height?: number | string;
  rounded?: number | string;
}

export function Skeleton({
  width,
  height = 16,
  rounded = 6,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={["qn-skeleton inline-block align-middle", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: width ?? "100%",
        height,
        borderRadius: rounded,
        ...style,
      }}
      {...rest}
    />
  );
}

/**
 * Roster table row skeleton. Footprint matches the real row (56px tall,
 * column widths align with the live table) so the page doesn't reflow when
 * data lands.
 */
export function SkeletonRow() {
  return (
    <div
      className="grid items-center px-4 py-3.5"
      style={{
        gridTemplateColumns:
          "minmax(200px,1fr) 120px 80px 110px 160px minmax(240px,2fr) 32px",
        columnGap: 16,
        minHeight: 56,
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <Skeleton width="65%" height={14} />
      <Skeleton width={88} height={14} />
      <Skeleton width={56} height={14} />
      <Skeleton width={72} height={18} rounded={9999} />
      <Skeleton width={120} height={20} rounded={9999} />
      <Skeleton width="80%" height={14} />
      <Skeleton width={16} height={16} />
    </div>
  );
}

/**
 * Roster mobile card skeleton. Matches §3.2: 72px min-height list row with
 * three text lines.
 */
export function SkeletonCardRow() {
  return (
    <div
      className="px-4 py-3.5"
      style={{
        minHeight: 72,
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton width="55%" height={16} />
        <Skeleton width={64} height={18} rounded={9999} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Skeleton width={84} height={12} />
        <Skeleton width={120} height={12} />
      </div>
      <div className="mt-1.5">
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  );
}

/**
 * Briefing card skeleton. Mirrors the four-section layout (hero, codes,
 * layer summary, evidence footer).
 */
export function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-lg bg-white"
      style={{ border: "1px solid var(--color-border)" }}
    >
      <div className="p-7" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Skeleton width={220} height={28} />
        <div className="mt-3 flex items-center gap-3">
          <Skeleton width={64} height={18} rounded={9999} />
          <Skeleton width={120} height={20} rounded={9999} />
        </div>
      </div>
      <div className="px-7 py-5">
        <Skeleton width={140} height={12} />
        <div className="mt-3 space-y-2">
          <Skeleton height={36} />
          <Skeleton height={36} />
          <Skeleton height={36} />
        </div>
      </div>
      <div className="px-7 py-5">
        <Skeleton width={120} height={12} />
        <div className="mt-3 space-y-2">
          <Skeleton height={32} />
          <Skeleton height={32} />
          <Skeleton height={32} />
          <Skeleton height={32} />
        </div>
      </div>
      <div
        className="flex items-center justify-between px-7 py-4"
        style={{ background: "var(--color-row-alt)" }}
      >
        <Skeleton width={120} height={14} />
        <Skeleton width={180} height={12} />
      </div>
    </div>
  );
}

export default Skeleton;
