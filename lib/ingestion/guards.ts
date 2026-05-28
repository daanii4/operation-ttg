/**
 * Sprint 7 / Workstream A-2 — environment guard.
 *
 * Every Class A ingestion entry point starts with this guard. It is a
 * THROW, not a soft warning. The pipeline never runs without an explicit
 * `DATA_FEED_ENABLED=true` set on the deployment environment.
 *
 * Why this strict? Class A ingestion writes verified-data-feed records that
 * downstream calculations treat as the highest-trust source. Accidentally
 * enabling it without a partnership agreement (MCP-2) would pollute the
 * audit trail. The guard makes accidental activation impossible.
 *
 * The flag is intentionally NOT in .env.example — it must only ever be set
 * directly in the deployment environment (Vercel project settings) so it
 * cannot be committed to source control.
 */

export function isDataFeedEnabled(): boolean {
  return process.env.DATA_FEED_ENABLED === "true";
}

export class DataFeedDisabledError extends Error {
  constructor() {
    super(
      "DATA_FEED_ENABLED is not set. Class A ingestion is disabled. " +
        "Set DATA_FEED_ENABLED=true to enable. Do not enable without legal review."
    );
    this.name = "DataFeedDisabledError";
  }
}

export function assertDataFeedEnabled(): void {
  if (!isDataFeedEnabled()) {
    throw new DataFeedDisabledError();
  }
}
