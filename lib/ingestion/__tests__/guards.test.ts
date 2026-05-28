/**
 * Sprint 7 / Workstream A — env guard tests.
 *
 * Pinned because the entire safety story for Class A ingestion rests on
 * `assertDataFeedEnabled()` throwing when the flag is missing or wrong.
 */

import {
  DataFeedDisabledError,
  assertDataFeedEnabled,
  isDataFeedEnabled,
} from "../guards";

describe("ingestion guards", () => {
  const original = process.env.DATA_FEED_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.DATA_FEED_ENABLED;
    } else {
      process.env.DATA_FEED_ENABLED = original;
    }
  });

  it("isDataFeedEnabled returns false when the flag is missing", () => {
    delete process.env.DATA_FEED_ENABLED;
    expect(isDataFeedEnabled()).toBe(false);
  });

  it("isDataFeedEnabled is strict — only the literal string 'true' counts", () => {
    process.env.DATA_FEED_ENABLED = "TRUE";
    expect(isDataFeedEnabled()).toBe(false);
    process.env.DATA_FEED_ENABLED = "1";
    expect(isDataFeedEnabled()).toBe(false);
    process.env.DATA_FEED_ENABLED = "true";
    expect(isDataFeedEnabled()).toBe(true);
  });

  it("assertDataFeedEnabled throws DataFeedDisabledError when disabled", () => {
    delete process.env.DATA_FEED_ENABLED;
    expect(() => assertDataFeedEnabled()).toThrow(DataFeedDisabledError);
  });

  it("assertDataFeedEnabled no-ops when enabled", () => {
    process.env.DATA_FEED_ENABLED = "true";
    expect(() => assertDataFeedEnabled()).not.toThrow();
  });
});
